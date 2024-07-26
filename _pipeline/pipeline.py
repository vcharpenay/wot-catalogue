from pathlib import Path
from traceback import print_exc
from rdflib import Graph
from lifting import lift

wd = Path(".")

def process_source(scheme, collection):
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

for dir in wd.iterdir():
    if dir.is_dir() and not dir.name.startswith("_"):
        for f in dir.iterdir():
            if f.name.endswith(".source"):
                scheme = dir.name
                collection = f.name.replace(".source", "")

                print(f"Processing {collection} in folder {scheme}")
                process_source(scheme, collection)