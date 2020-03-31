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

function isExactMatch(word, sense) {
    let normalized = sense.match.text
        .replace(/\W|_/g, ' ')
        .trim()
        .toLowerCase();

    return word == normalized;
}

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const denotations = {};

const senses = fs.existsSync('../wikidata-senses.json')
    ? JSON.parse(fs.readFileSync('../wikidata-senses.json'))
    : {};

urdf.load(txt, { format: 'text/turtle' })

.then(() => console.log('Retrieving labels...'))

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
        console.log('Wikidata cache hit. Skipping service query...');
        return Promise.resolve();
    } else {
        console.log('Querying Wikidata search service with labels...');
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

.then(() => console.log('Done matching labels with Wikidata senses. Writing to file...'))

.then(() => {
    let skos = 'http://www.w3.org/2004/02/skos/core#';
    let ontolex = 'http://www.w3.org/ns/lemon/ontolex#';

    let words = Object.keys(senses);

    let matches = words.reduce((matches, w) => {
        matches[w] = senses[w].filter(s => isExactMatch(w, s));
        return matches;
    }, {});

    // remove (n+m)-grams without sense mapping
    words = words.filter(ngram => {
        let hasSense = matches[ngram].length > 0;
        let isNGram = words.some(w => ngram != w && ngram.includes(w));
        return hasSense || !isNGram;
    });

    // TODO remove (n-m)-grams with mapping but not evoking any concept

    fs.writeFileSync('../wikidata-mapping.ttl', ''); // erase previous content

    words.forEach(w => {
        let nt = '';
        let tag = `tag:${encodeURIComponent(w)}`;

        let m = matches[w];

        nt += denotations[w].reduce((nt, c) => {
            // FIXME only one ontolex:isEvokedBy
            if (m.length > 0) nt += `<${c}> <${skos}mappingRelation> <${tag}> .\n`;
            return nt += `<${c}> <${ontolex}isEvokedBy> <${tag}> .\n`;
        }, nt);

        nt += m.reduce((nt, s) => {
            // FIXME replace with ontolex:denotes
            return nt += `<${tag}> <${ontolex}evokes> <${s.concepturi}>.\n`;
        }, nt);

        fs.writeFileSync('../wikidata-mapping.ttl', nt, { flag: 'a' });
    });
})

.then(() => console.log('Done. Output written to ../wikidata-mapping.ttl.'))

.catch(e => {
    // log intermediate results and exit
    if (!fs.existsSync('../wikidata-senses.json')) {
        fs.writeFileSync('../wikidata-senses.tmp.json', JSON.stringify(senses));
    }

    console.error(e);
});