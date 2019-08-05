const fs = require('fs');
const urdf = require('urdf');
const WordPOS = require('wordpos');
const pluralize = require('pluralize');

const q = '\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select distinct ?l where {\
    ?concept skos:hiddenLabel ?l\
}\
';

const txt = fs.readFileSync('../labels.ttl', 'utf-8');

const wpos = new WordPOS();

urdf.load(txt, { format: 'text/turtle' })

.then(() => urdf.query(q))

.then(res => {
    res = res.map(b => b.l.value);

    let promises = res.map(l => {
        if (pluralize.isPlural(l)) l = pluralize.singular(l);
        // TODO process verbs in past tense (-ed + irregular verbs)

        return Promise.all([
            wpos.lookupNoun(l),
            wpos.lookupVerb(l),
            wpos.lookupAdjective(l),
            wpos.lookupAdverb(l)
        ])
        .then(pos => {
            let synset = pos.find(s => s.length > 0) || [];
            return [l, synset];
        });
    });

    return Promise.all(promises);
})

.then(synsets => {
    synsets.forEach(([w, set]) => {
        // console.log(set.length)
        console.log(w + '(' + set.length + ')');
        set.forEach(ss => console.log('\t' + ss.synonyms));
    });
});