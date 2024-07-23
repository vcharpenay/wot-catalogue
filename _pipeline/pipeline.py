from rdflib import Graph
from lifting import lwm2m

with open("lwm2m/.sources", "r") as sources:
    g = Graph()

    for uri in sources:
        try:
            uri = uri.replace("\n", "")
            for t in lwm2m(uri): g.add(t)
        except:
            print("Failed to process source: ", uri)
        
    g.serialize(destination="lwm2m/ipso.ttl")