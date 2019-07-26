const fs = require('fs');
const urdf = require('urdf');

const q = '\
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select * where {\
    ?concept a skos:Concept; rdfs:label ?label .\
}';

function ls(dir) {
    return fs.readdirSync(dir)
      .map(f => dir + '/' + f)
      .map(f => fs.statSync(f).isDirectory() ? ls(f) : [f])
      .reduce((l, subl) => l.concat(subl), []);
}

function norm(label) {
    return label
        .replace(/\W/g, ' ')
        .replace(/([^A-Z])([A-Z])([^A-Z])/g, '$1 $2$3') // camel-case label
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

let promises = ls('..')
    .filter(f =>  f.match(/.*\/.*\/.*\.ttl$/)) // Turtle file inside a directory
    .map(f => {
        console.log(f)
        let ttl = fs.readFileSync(f, 'utf-8');
        return urdf.load(ttl, { format: 'text/turtle' });
    });

Promise.all(promises)

.then(() => urdf.query(q)) // TODO missing labels

.then(res => res
    .reduce((nt, b) => {
        let skos = 'http://www.w3.org/2004/02/skos/core#';
        let c = b.concept.value;
        let l = norm(b.label.value);
        nt += `<${c}> <${skos}prefLabel> "${l}" .\n`;
        return l.split(' ')
                .reduce((nt, kw) => nt + `<${c}> <${skos}hiddenLabel> "${kw}" .\n`, nt)
    }, ''))

.then(nt => fs.writeFileSync('../labels.ttl', nt))

.catch(e => console.error(e));