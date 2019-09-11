const fs = require('fs');
const urdf = require('urdf');
const mw = require('mediawiki');

const q = '\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select distinct ?c ?l where {\
    ?c skos:prefLabel ?l\
}\
';

function ngrams(words) {
    let all = [];

    for (let n = words.length; n > 0; n--) {
        for (let i = 0; i + n <= words.length; i++) {
            let ngram = words.slice(i, i + n);
            all.push(ngram.join(' '));
        }
    }

    return all;
}

const bot = new mw.Bot({
    endpoint: 'https://www.wikidata.org/w/api.php',
    rate: 500,
    userAgent: 'wot-catalogue/0.0 (https://github.com/vcharpenay/wot-catalogue; victor.charpenay@fau.de)'
});

function searchEntities(word) {
    return new Promise((resolve, reject) => {
        let req = bot.get({
            action: 'wbsearchentities',
            search: word,
            language: 'en',
            format: 'json',
            strictlanguage: true
        });

        req.complete(resp => resolve(resp));
        req.error(e => reject(e));
    });
}

function searchClaims(ids) {
    if (ids.length == 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
        let req = bot.get({
            action: 'wbgetentities',
            ids: ids.reduce((str, id) => str + '|' + id),
            props: 'claims',
            format: 'json',
            languages: 'en'
        });

        req.complete(resp => resolve(resp));
        req.error(e => reject(e));
    });
}

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const denotations = {};

const senses = fs.existsSync('../wikidata-senses.json')
    ? JSON.parse(fs.readFileSync('../wikidata-senses.json'))
    : {};

const claims = fs.existsSync('../wikidata-claims.json')
    ? JSON.parse(fs.readFileSync('../wikidata-claims.json'))
    : {};

const batchSize = 25;
const maxRecursions = 3;
const maxClaimsPerBlock = 25000;

urdf.load(txt, { format: 'text/turtle' })

.then(() => urdf.query(q))

.then(res => {
    res.forEach(b => {
        let concept = b.c.value;
        let label = b.l.value;

        ngrams(label.split(' ')).forEach(w => {
            if (!denotations[w]) denotations[w] = [];
            denotations[w].push(concept);
        });
    });

    if (Object.keys(senses).length > 0) {
        // Wikidata content already cached
        return Promise.resolve();
    } else {
        // Wikidata search service is queried, if no cache found
        let words = Object.keys(denotations).reduce((set, w) => {
            if (set.indexOf(w) < 0) set.push(w);
            return set;
        }, []);

        let promises = words.map(w => {
            return new Promise((resolve, reject) => {
                return searchEntities(w).then(resp => {
                    let entities = resp.search;
                    senses[w] = entities;

                    console.log(`done: ${w}`);

                    resolve();
                });
            });
        });
    
        return Promise.all(promises)
        .then(() => fs.writeFileSync('../wikidata-senses.json', JSON.stringify(senses)));
    }
})

.then(() => {
    if (Object.keys(claims).length > 0) {
        // Wikidata claims already cached
        return Promise.resolve();
    } else {
        return new Promise((resolve, reject) => {
            let recursions = {};
            let queue = [];
            let block = 0;

            // recursive process
            let processClaims = resp => {
                let batch = [];
    
                // TODO if request failed, get ids from somewhere
                let ids = Object.keys(resp.entities || {});
                queue = queue.filter(id => ids.indexOf(id) < 0);
    
                if (!resp.success) return;
        
                for (let id in resp.entities) {
                    claims[id] = resp.entities[id].claims;
        
                    if (recursions[id] < maxRecursions) {
                        for (let p in claims[id]) {
                            claims[id][p].forEach(st => {
                                if (st.mainsnak.datatype == 'wikibase-item' && st.mainsnak.datavalue) {
                                    let otherId = st.mainsnak.datavalue.value.id;
                                    if (!recursions[otherId] && !batch.includes(otherId)) {
                                        batch.push(otherId);
                                        recursions[otherId] = recursions[id] + 1;
                                        queue.push(otherId);
                                    }
                                }
                            });
                        }
                    }
        
                    console.log(`done: ${id}`);
                }

                for (let i = 0; i < batch.length; i += batchSize) {
                    let subbatch = batch.slice(i, i + batchSize);
                    searchClaims(subbatch).then(resp => processClaims(resp));
                }

                if (Object.keys(claims).length > maxClaimsPerBlock) {
                    fs.writeFileSync(`../wikidata-claims-${block++}.json`, JSON.stringify(claims));
                    claims = {};
                }

                if (queue.length == 0) resolve();
            };
        
            let batch = [];
            let words = Object.keys(senses);

            while (words.length > 0) {
                let w = words.pop();
        
                senses[w].forEach(s => {
                    batch.push(s.id);
                    recursions[s.id] = 0;
                    queue.push(s.id);
                });
        
                if (words.length == 0 || batch.length > batchSize) {
                    let b = batch.map(s => s); // copy of batch
                    searchClaims(b).then(resp => processClaims(resp));
        
                    batch = [];
                }
            }
        });
    }
})

.then(() => {
    // TODO generate N-Triples
})

.catch(e => {
    // log intermediate results and exit
    if (!fs.existsSync('../wikidata-senses.json')) {
        fs.writeFileSync('../wikidata-senses.tmp.json', JSON.stringify(senses));
    }
    if (!fs.existsSync('../wikidata-claims.json')) {
        fs.writeFileSync('../wikidata-claims.tmp.json', JSON.stringify(claims));
    }
    console.error(e.message);
});