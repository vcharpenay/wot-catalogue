const fs = require('fs');
const urdf = require('urdf');
const WordPOS = require('wordpos');
const pluralize = require('pluralize');

const q = '\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select distinct ?c ?l where {\
    ?c skos:prefLabel ?l\
}\
';

function subgraph(concepts, relations) {
    return concepts.reduce((g, c) => {
        if (relations[c] && !g[c]) {
            g[c] = relations[c];

            let sg = subgraph(relations[c], relations);
            for (let sc in sg) g[sc] = sg[sc];
        }

        return g;
    }, {});
}

// TODO  when considering a full knowledge graph,
//       should also take the number of edges into account
//       (here, only number of vertices).
function fitness(concepts, relations) {
    let g = subgraph(concepts, relations);

    return 1 / Object.keys(g).length;
}

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

function wordnetId(synset) {
    let id = String(synset.synsetOffset);
    id = '00000000'.substring(0, 8 - id.length) + id;
    return `http://wordnet-rdf.princeton.edu/id/${id}-${synset.pos}`;
}
 
const links = fs.readFileSync('all-hypernyms.csv', 'utf-8')
    .split('\n')
    .map(r => r.split(',').map(col => col.replace(/"|,| /g, '')))
    .reduce((idx, [sub, sup]) => {
        if (!idx[sub]) idx[sub] = [];
        idx[sub].push(sup);
        return idx;
    }, {});

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const wpos = new WordPOS();

const senses = {};

const denotations = {};

urdf.load(txt, { format: 'text/turtle' })

.then(() => urdf.query(q))

.then(res => {
    let promises = res.map(b => {
        let concept = b.c.value;
        let label = b.l.value;

        return Promise.all(ngrams(label.split(' ')).map(w => {
            if (pluralize.isPlural(w)) w = pluralize.singular(w);
            // TODO process verbs in past tense (-ed + irregular verbs)
            // TODO same for -ing forms

            if (!denotations[w]) denotations[w] = [];
            denotations[w].push(concept);

            if (senses[w]) return Promise.resolve();
    
            return Promise.all([
                wpos.lookupNoun(w),
                wpos.lookupVerb(w),
                wpos.lookupAdjective(w),
                wpos.lookupAdverb(w)
            ])
            .then(pos => {
                // selects only one POS, by preference (n, v, s, a)
                let synsets = pos.find(s => s.length > 0) || [];
                senses[w] = synsets.map(wordnetId);
            });
        }));
    });

    return Promise.all(promises);
})

.then(() => {
    let labels = Object.keys(senses)
        .filter(l => senses[l].length > 0)
        .sort((l1, l2) => senses[l1].length - senses[l2].length);
        
    // greedy algorithm
    // TODO disambiguate per concept scheme, not globally
    let disambiguated = labels.reduce((dis, l) => {
        let prev = Object.values(dis);

        let best = senses[l].map(s => [s, fitness([...prev, s], links)])
                 .sort((f1, f2) => f2[1] - f1[1])
                 [0][0];

        dis[l] = best;

        return dis;
    }, {});

    let skos = 'http://www.w3.org/2004/02/skos/core#';

    let nt = labels.reduce((nt, l) => {
        return denotations[l].reduce((nt, c) => {
            return nt + `<${c}> <${skos}mappingRelation> <${disambiguated[l]}> .\n`;
        }, nt);
    }, '');

    fs.writeFileSync('../wordnet-mapping.ttl', nt);
})

.catch(e => console.error(e));