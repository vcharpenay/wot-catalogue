const fs = require('fs');
const urdf = require('urdf');

const q = '\
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
prefix skos: <http://www.w3.org/2004/02/skos/core#>\
select * where {\
    ?concept a skos:Concept; rdfs:label ?label .\
}';

const files = [
    '../BACnet/bacnet-top.ttl',
    '../BACnet/bacnet.ttl',
    '../BLE GATT/gatt.ttl',
    '../BLE GATT/ble.ttl', 
    '../LWM2M/lwm2m.ttl',
    '../LWM2M/ipso.ttl',
    '../OCF/swagger.ttl',
    '../OCF/oneiota.ttl',
    '../oneM2M/sdt.ttl',
    '../oneM2M/haim.ttl',
    '../Project Haystack/haystack-top.ttl',
    '../Project Haystack/haystack.ttl'
];

function norm(label) {
    return label
        .replace(/\W|_/g, ' ')
        .replace(/(\S)?([A-Z])([a-z0-9])/g, '$1 $2$3') // camel-case label
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

let promises = files
    .map(f => {
        let ttl = fs.readFileSync(f, 'utf-8');
        console.log(`Reading ${f}...`);
        return urdf.load(ttl, { format: 'text/turtle' });
    });

Promise.all(promises)

.then(() => console.log('Done reading files. Normalizing labels...'))

.then(() => urdf.query(q)) // TODO missing labels

.then(res => res
    .reduce((nt, b) => {
        let skos = 'http://www.w3.org/2004/02/skos/core#';
        let c = b.concept.value;
        let l = norm(b.label.value);
        return nt + `<${c}> <${skos}prefLabel> "${l}" .\n`;
    }, ''))

.then(nt => fs.writeFileSync('../labels.ttl', nt))

.then(() => console.log('Done. Output written to ../labels.ttl.'))

.catch(e => console.error(e));