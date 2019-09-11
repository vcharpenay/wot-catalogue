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
select distinct ?concept ?label ?hidden ?definition {\
    <${c}> skos:mappingRelation ?concept . \
    ?concept skos:prefLabel ?label ;\
           skos:definition ?definition .\
    optional { ?concept skos:hiddenLabel ?hidden }\
}\
`;

function trim(str) {
    return lunr.tokenizer(str)
        .map(t => lunr.trimmer(t).str)
       .reduce((trimmed, w) => trimmed + ' ' + w, '')
       .replace(/([\:\*\^~\+\-])/g, '\\$1'); 
}

const files = [
    '../Project Haystack/haystack.ttl', // TODO turn into script arg
    '../labels.ttl',
    '../wordnet-mapping.ttl',
    '../wordnet-concepts.ttl'
];

const opts = { format: 'text/turtle' };

const matches = {};

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

            matches[c.concept] = idx.search(`${c.label} ${trim(c.definition)}`);

            console.log(`done: ${c.label}`);
        });
    });

    return Promise.all(promises);
})

.then(() => {
    // TODO consensus-making process: for every word, concepts map to different
    // meanings although they should map to the same
    // procedure: if conflict, take the most confident

    fs.writeFileSync('../wordnet-matches.json', JSON.stringify(matches));
})

.catch(e => {
    console.log(e);
});