from pathlib import Path
from os import mkdir
from zlib import adler32
from requests import get
from xml.etree import ElementTree
from rdflib import Graph, URIRef, Literal, Namespace, SKOS, PROV, RDF

def _get(uri):
    cache = Path(".cache")
    if not cache.exists(): mkdir(cache.name)

    h = Path(cache.name, hex(adler32(uri.encode()))[2:])
    
    if h.exists():
        with open(h, "r") as f: return f.read()
    else:
        res = get(uri)
        cnt = str(res.content, encoding="UTF-8")
        with open(h, "w") as f: f.write(cnt)
        return cnt

def lwm2m(uri) -> Graph:
    xml = ElementTree.fromstring(_get(uri))

    g = Graph()

    object = xml.find("Object")
    id = object.find("ObjectID").text
    label = object.find("Name").text
    desc = object.find("Description1").text

    ipso = Namespace("http://purl.org/wot-catalogue/lwm2m/ipso#")
    ontolex = Namespace("http://www.w3.org/ns/lemon/ontolex#")
    lwm2m = Namespace("http://purl.org/wot-catalogue/lwm2m#")
    g.bind("ontolex", ontolex)
    g.bind("lwm2m", lwm2m)
    g.bind("ipso", ipso)

    c = ipso.__getitem__(id)

    g.add((c, RDF.type, SKOS.Concept))
    g.add((c, RDF.type, ontolex.LexicalConcept))
    g.add((c, SKOS.prefLabel, Literal(label, lang="en")))
    g.add((c, SKOS.definition, Literal(desc, lang="en")))
    g.add((c, SKOS.broader, lwm2m.Object))
    g.add((ipso.collection, SKOS.member, c))
    g.add((c, SKOS.inScheme, lwm2m.scheme))
    g.add((c, PROV.wasDerivedFrom, URIRef(uri)))

    for item in object.find("Resources"):
        itemId = item.get("ID")
        itemLabel = item.find("Name").text
        itemDesc = item.find("Description").text
        op = item.find("Operations").text

        i = ipso.__getitem__(itemId)

        g.add((c, SKOS.related, i))
        g.add((i, RDF.type, SKOS.Concept))
        g.add((i, RDF.type, ontolex.LexicalConcept))
        g.add((i, SKOS.prefLabel, Literal(itemLabel, lang="en")))
        g.add((i, SKOS.definition, Literal(itemDesc, lang="en")))
        g.add((i, SKOS.broader, lwm2m.Resource))
        g.add((ipso.collection, SKOS.member, i))
        g.add((c, SKOS.inScheme, lwm2m.scheme))
        g.add((i, SKOS.related, lwm2m.__getitem__(op)))

    return g