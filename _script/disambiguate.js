const fs = require('fs');
const urdf = require('urdf');
const lunr = require('lunr');

const conceptsQuery = '\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select distinct ?concept ?label ?definition where {\
    ?concept skos:prefLabel ?label ;\
             skos:definition ?definition ;\
             skos:mappingRelation ?other .\
}\
';

const mappingsQuery = c => `\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
prefix ontolex: <http://www.w3.org/ns/lemon/ontolex#>\
select distinct ?concept ?label ?hidden ?definition {\
    <${c}> skos:mappingRelation ?word .\
    ?word ontolex:evokes ?concept . \
    ?concept skos:prefLabel ?label ;\
             skos:definition ?definition .\
    optional { ?concept skos:hiddenLabel ?hidden }\
}\
`;

const sensesQuery = '\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
prefix ontolex: <http://www.w3.org/ns/lemon/ontolex#>\
select distinct ?word ?concept where {\
    ?other skos:prefLabel ?label ;\
           skos:definition ?definition ;\
           skos:mappingRelation ?word .\
    ?word ontolex:evokes ?concept .\
}\
';

function trim(str) {
    return lunr.tokenizer(str)
        .map(t => lunr.trimmer(t).str)
       .reduce((trimmed, w) => trimmed + ' ' + w, '')
       .replace(/([\:\*\^~\+\-])/g, '\\$1'); 
}

const files = [
    // TODO turn into script arg
    '../Project Haystack/haystack.ttl',
    '../labels.ttl',
    '../wordnet-mapping.ttl',
    '../wordnet-concepts.ttl'
];

const opts = { format: 'text/turtle' };

const matches = {};

const senses = {};

files
.map(f => fs.readFileSync(f, 'utf-8'))
.reduce((p, ttl) => p.then(() => urdf.load(ttl), opts), Promise.resolve())

.then(() => urdf.query(conceptsQuery))

.then(conceptsRes => {
    let promises = conceptsRes.map(b => {
        let c = {};
        for (let k in b) c[k] = b[k].value;

        return urdf.query(mappingsQuery(c.concept))

        .then(mappingsRes => {
            let docs = mappingsRes.map(b => {
                let other = {};
                for (let k in b) other[k] = b[k].value;
                return other;
            });

            let idx = lunr(function() {
                this.ref('concept');
                this.field('label');
                this.field('hidden');
                this.field('definition');
            
                docs.forEach(doc => this.add(doc), this);
            });

            // FIXME search doesn't return a score for every doc (threshold?)
            idx.search(`${c.label} ${trim(c.definition)}`).forEach(m => {
                let sense = m.ref;

                if (!matches[sense]) matches[sense] = {};
                matches[sense][c.concept] = m.score;
            });

            console.log(`done: ${c.label}`);
        });
    });

    return Promise.all(promises);
})

.then(() => fs.writeFileSync('../matches.json', JSON.stringify(matches)))

.then(() => urdf.query(sensesQuery))

.then(sensesRes => {
    // aggregation of lexical concepts by word
    sensesRes.reduce((s, b) => {
        let c = b.concept.value;
        let w = b.word.value;

        if (!s[w]) s[w] = [];
        s[w].push(c);
        
        return s;
    }, senses);
})

.then(() => {
    let words = Object.keys(senses);

    return words
    .map(w => {
        let s = senses[w];

        // record of best scoring senses
        let scores = s.reduce((scores, c) => {
            if (!matches[c]) return scores;

            let concepts = Object.keys(matches[c]);
            concepts.sort((c1, c2) => matches[c][c1] < matches[c[c2]]);

            let best = concepts[0];

            if (!scores[c] || matches[c][best] > scores[c]) scores[c] = matches[c][best];

            return scores;
        }, {});

        s = Object.keys(scores);
        
        // winner-takes-all consensus-making across senses
        s.sort((c1, c2) => scores[c1] < scores[c2]);

        return s[0];
    })
    .filter(s => s);
})

.then(lexicon => {
    let skos = 'http://www.w3.org/2004/02/skos/core#';

    let nt = lexicon.reduce((nt, s) => {
        let concepts = Object.keys(matches[s]);

        return concepts.reduce((nt, c) => {
            return nt + `<${c}> <${skos}mappingRelation> <${s}> .\n`;
        }, nt);
    }, '');

    fs.writeFileSync('../disambiguated-mapping.ttl', nt);
})

.catch(e => {
    console.log(e);
});