const fs = require('fs');
const urdf = require('urdf');
const WordPOS = require('wordpos');

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
    let promises = res.map(b => b.l.value)
                      .map(l => wpos.lookup(l));

    return Promise.all(promises);
})

.then(synsets => {
    synsets.forEach(set => {
        console.log(set.length);
    });
});