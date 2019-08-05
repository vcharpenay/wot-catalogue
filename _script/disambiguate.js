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
    if (words.length == 1) return [words];

    let p = words[0] + ' ' + words[1];

    let ngrams2 = ngrams([p, ...words.slice(2)]);
    let ngrams1 = ngrams(words.slice(1)).map(ng => [words[0], ...ng]);
    
    return [...ngrams2, ...ngrams1];
}

function byLength(ngram, mgram) {
    // TODO is [4, 2] better than [3, 3]?
    return ngram.length - mgram.length;
}

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const wpos = new WordPOS();

urdf.load(txt, { format: 'text/turtle' })

.then(() => urdf.query(q))

.then(res => {
    labels = res.map(b => b.l.value)
                .map(l => ngrams(l.split(' ')).sort(byLength));

    let promises = res.map(b => {
        let concept = b.c.value;
        let label = b.l.value;

        let sequences = ngrams(label.split(' ')).sort(byLength);
        return Promise.all(sequences.map(seq => {
            return Promise.all(seq.map(w => {
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
            }));
        }))
        .then(synsets => {
            let seq = synsets.find(seq => seq.some(s => s.length > 0)) || [];
            return [concept, seq];
        });
    });

    return Promise.all(promises);
})

.then(synsets => {
    synsets.forEach(([c, s]) => {
        console.log(c + ' (' + s.length + ')');
        s.forEach(ss => console.log('\t' + ss.length));
    });
});