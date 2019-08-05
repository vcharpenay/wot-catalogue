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

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const wpos = new WordPOS();

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
    
            return Promise.all([
                wpos.lookupNoun(w),
                wpos.lookupVerb(w),
                wpos.lookupAdjective(w),
                wpos.lookupAdverb(w)
            ])
            .then(pos => {
                let synset = pos.find(s => s.length > 0) || [];
                return synset;
            });
        }))
        .then(synsets => {
            let choice = synsets.reduce((choice, s) => choice.concat(s), []);
            return [concept, choice];
        });
    });

    return Promise.all(promises);
})

.then(concepts => {
    let skos = 'http://www.w3.org/2004/02/skos/core#';
    let wnid = 'http://wordnet-rdf.princeton.edu/id/';

    let nt = concepts.reduce((nt, [concept, synsets]) => {
        return synsets.reduce((nt, s) => {
            let id = String(s.synsetOffset);
            id = '00000000'.substring(0, 8 - id.length) + id;
            return nt + `<${concept}> <${skos}mappingRelation> <${wnid}${id}-${s.pos}> .\n`;
        }, nt);
    }, '');

    fs.writeFileSync('../wordnet-mapping.ttl', nt);
})

.catch(e => console.error(e));