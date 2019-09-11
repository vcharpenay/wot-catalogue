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

function wordnetId(synset) {
    let id = String(synset.synsetOffset);
    id = '00000000'.substring(0, 8 - id.length) + id;
    return `http://wordnet-rdf.princeton.edu/id/${id}-${synset.pos}`;
}

function wordnetLemma(word) {
    let escaped = encodeURIComponent(word);
    // TODO in theory, POS should be taken into account (#{word}-{pos})
    return `http://wordnet-rdf.princeton.edu/rdf/lemma/${escaped}`;
}

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

            if (!denotations[concept]) denotations[concept] = [];
            denotations[concept].push(w);

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
                senses[w] = synsets;
            });
        }));
    });

    return Promise.all(promises);
})

.then(() => {
    let skos = 'http://www.w3.org/2004/02/skos/core#';
    let ontolex = 'http://www.w3.org/ns/lemon/ontolex#';

    let words = Object.keys(senses);

    let nt = words.reduce((nt, w) => {
        let s = senses[w];

        if (s.length == 0) return nt;
        
        let entry = wordnetLemma(w);
        let entities = s.map(wordnetId);

        return entities.reduce((nt, e) => {
            return nt + `<${entry}> <${ontolex}evokes> <${e}>.\n`;
        }, nt);
    }, '');

    let concepts = Object.keys(denotations);

    nt = concepts.reduce((nt, c) => {
        let words = denotations[c];
        words = words.filter(w => senses[w].length > 0);
        words = words.filter(w => !words.some(other => other != w && other.includes(w)));

        let entries = words.map(wordnetLemma);

        return entries.reduce((nt, e) => {
            return nt + `<${c}> <${skos}mappingRelation> <${e}> .\n`;
        }, nt);
    }, nt);

    fs.writeFileSync('../wordnet-mapping.ttl', nt);
})

.catch(e => console.error(e));