from traceback import print_exc
from rdflib import Graph
from lifting import lift

# TODO browse folders, look for <collection>.source

# scheme = "lwm2m"
# collection = "ipso"

# scheme = "ble"
# collection = "gatt"

# scheme = "bacnet"
# collection = "core"

scheme = "onem2m"
collection = "haim"

with open(f"{scheme}/{collection}.source", "r") as sources:
    g = Graph()

    for uri in sources:
        try:
            uri = uri.replace("\n", "")
            coll = lift(uri, scheme)
            for t in coll: g.add(t)
            for prefix, ns in coll.namespaces(): g.bind(prefix, ns)
        except:
            print("Failed to process source: ", uri)
            print_exc()

    g.serialize(destination=f"{scheme}/{collection}.ttl")