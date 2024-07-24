from pathlib import Path
from os import mkdir
from zlib import adler32
from requests import get
from xml.etree import ElementTree
from rdflib import Graph, URIRef, Literal, Namespace, SKOS, PROV, RDF

ONTOLEX = Namespace("http://www.w3.org/ns/lemon/ontolex#")

def _get(uri) -> str:
    """
    Dereference the URI with a GET request, or retrieve from cache if found. 
    """
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

def _add_concept(g: Graph, c: URIRef, *, label: str, description: str = None, parent: URIRef, collection: URIRef, scheme: URIRef, origin: URIRef = None):
    g.add((c, RDF.type, SKOS.Concept))
    g.add((c, RDF.type, ONTOLEX.LexicalConcept))
    g.add((c, SKOS.prefLabel, Literal(label, lang="en")))
    g.add((c, SKOS.broader, parent))
    g.add((collection, SKOS.member, c))
    g.add((c, SKOS.inScheme, scheme))

    if description: g.add((c, SKOS.definition, Literal(description, lang="en")))
    if origin: g.add((c, PROV.wasDerivedFrom, origin))

def lift_bacnet(uri) -> Graph:
    ttl = _get(uri)

    src = Graph()
    src.parse(data=ttl, format="ttl")

    with open("_pipeline/bacnet-construct.rq", "r") as f: q = f.read()
    res = src.query(q)

    g = Graph()

    bacnet = Namespace("http://purl.org/wot-catalogue/bacnet#")
    core = Namespace("http://purl.org/wot-catalogue/bacnet/core#")
    g.bind("bacnet", bacnet)
    g.bind("core", core)

    for t in res: g.add(t)

    return g

def lift_ble(uri) -> Graph:
    service = ElementTree.fromstring(_get(uri))

    g = Graph()

    ble = Namespace("http://purl.org/wot-catalogue/ble#")
    gatt = Namespace("http://purl.org/wot-catalogue/gatt#")
    g.bind("ontolex", ONTOLEX)
    g.bind("ble", ble)
    g.bind("gatt", gatt)

    id = service.get("uuid")

    c = gatt.__getitem__(id)

    _add_concept(
        g, c,
        label=service.get("name"),
        description=service.find("InformativeText").find("Abstract").text,
        parent=ble.Service,
        collection=gatt.collection,
        scheme=ble.scheme,
        origin=URIRef(uri)
    )

    for characteristic in service.find("Characteristics"):
        prefix = uri[:uri.rfind("/")+1]
        name = characteristic.get("type") + ".xml"
        c_uri = prefix + name

        try:
            characteristic = ElementTree.fromstring(_get(c_uri))
        except:
            print("Failed to fetch document: ", c_uri)
            raise RuntimeError()

        chid = characteristic.get("uuid")

        ch = gatt.__getitem__(chid)

        ch_desc = None
        ch_text = characteristic.find("InformativeText")

        if ch_text:
            if "Abstract" in ch_text: ch_desc = ch_text.find("Abstract").text
            elif "Summary" in ch_text: ch_text.find("Summary")

        _add_concept(
            g, ch,
            label=characteristic.get("name"),
            description=ch_desc,
            parent=ble.Characteristic,
            collection=gatt.collection,
            scheme=ble.scheme,
            origin=URIRef(c_uri)
        )

        g.add((c, SKOS.related, ch))

        if "Value" in characteristic:
            for i, field in enumerate(characteristic.find("Value")):
                f = gatt.__getitem__(f"{chid}-{i}")

                f_desc = None
                if "InformativeText" in field:
                    f_desc = field.find("InformativeText").text

                _add_concept(
                    g, f,
                    label=field.get("name"),
                    description=f_desc,
                    parent=ble.Field,
                    collection=gatt.collection,
                    scheme=ble.scheme
                )
                
                g.add((ch, SKOS.related, f))

    return g

def lift_lwm2m(uri) -> Graph:
    xml = ElementTree.fromstring(_get(uri))

    object = xml.find("Object")
    id = object.find("ObjectID").text

    g = Graph()

    ipso = Namespace("http://purl.org/wot-catalogue/lwm2m/ipso#")
    lwm2m = Namespace("http://purl.org/wot-catalogue/lwm2m#")
    g.bind("ontolex", ONTOLEX)
    g.bind("lwm2m", lwm2m)
    g.bind("ipso", ipso)

    c = ipso.__getitem__(id)

    _add_concept(
        g, c,
        label=object.find("Name").text,
        description=object.find("Description1").text,
        parent=lwm2m.Object,
        collection=ipso.collection,
        scheme=lwm2m.scheme,
        origin=URIRef(uri)
    )

    for item in object.find("Resources"):
        itemId = item.get("ID")
        op = item.find("Operations").text

        i = ipso.__getitem__(itemId)

        _add_concept(
            g, i,
            label=item.find("Name").text,
            description=item.find("Description").text,
            parent=lwm2m.Resource,
            collection=ipso.collection,
            scheme=lwm2m.scheme
        )

        g.add((i, SKOS.related, lwm2m.__getitem__(op)))

    return g

def lift(uri, scheme):
    match scheme:
        case "ble": return lift_ble(uri)
        case "bacnet": return lift_bacnet(uri)
        case "lwm2m": return lift_lwm2m(uri)