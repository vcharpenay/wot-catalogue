# Web of Things Catalogue

The Web of Things (WoT) catalogue is a collection of concepts extracted
from the following communication and classification standards:
 - BLE GATT
 - BACnet
 - oneM2M
 - OCF
 - OMA LWM2M
 - Project Haystack
 - EDDL (TODO)
 - eCl@ss (TODO)
 - IFC (TODO)
 - OPC UA (TODO)

## Getting Started

See the [online search engine](http://www.vcharpenay.link/wot-catalogue/) to browse concepts.

## Documentation

Concept definitions follow the
[Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) W3C standard.
SKOS includes two kinds of relation between concepts: subsumption (or inheritance) and relatednes.
On the following diagram, the base information model for each standard is represented with these
two relation types only (white triangle for subsumption, black diamond for relatedness).

![Standard information models](info-models.png)

Here, relatedness is interpreted as a variant of UML's composition relation between entities.
As a result, all information models are tree-shaped. This relation type is the most abstract
feature encompassing all formalisms under study.

For each concept included in the WoT catalogue, the following fields are available:
 - label
 - human-readable definition
 - related concepts (within the same standard)
 - related data types
 - potential matches with concepts from other standards (TODO)
 - potential matches with class definitions from other RDF vocabularies (TODO)
 - source documentation (TODO)

Example (from [`esp.ttl`](BLE GATT/esp.ttl)):

```turtle
esp:EnvironmentalSensingProfile
    a skos:Concept ;
    rdfs:label "Environmental Sensing Profile" ;
    skos:definition "The Cycling Speed and Cadence Profile is used to enable..." ;
    rdfs:seeAlso <https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=294796> .
```