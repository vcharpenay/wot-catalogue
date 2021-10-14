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
 - [OPC UA](https://github.com/OPCFoundation/UA-Nodeset) (TODO)
 - [ICM](https://cimug.ucaiug.org/CIM%20Profiles/Forms/AllItems.aspx) (TODO)

## Getting Started

See the [online search engine](http://www.vcharpenay.link/wot-catalogue/) to browse concepts or download [the full catalogue in Turtle](wot-catalogue.ttl).

## Documentation

Concept definitions follow the
[Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) W3C standard.
SKOS includes two kinds of relation between concepts: subsumption (or inheritance) and relatednes.
SKOS concepts are also put in different collections and schemes. A scheme corresponds to a source
information model, assumed to be internally consistent but not necessarily consistent with other
sources. If an information model spans several application domains, concepts are grouped in
separate collections (one for each domain).

The WoT catalogue also keeps track of lexical entries that are used to derive concepts (words or
sequences of words). For that purpose, the catalogue also uses the
[Ontolex vocabulary](https://www.w3.org/2016/05/ontolex/#lexical-entries). Distinguishing between
concepts and lexical entries allows then to link concepts with lexical relations (such as
synonymy) and to keep track of possible ambigiuity in concept definitions. The following diagram
shows how SKOS and Ontolex are jointly used.

![Concept model](concept-model.dot.png)

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
 - matches with Wikidata
 - source documentation (TODO)

Example (from [`gatt.ttl`](BLE GATT/gatt.ttl)):

```turtle
ble:TemperatureMeasurement a skos:Concept, ontolex:LexicalConcept ;
                           skos:prefLabel "temperature measurement" ;
                           skos:definition "The Temperature Measurement characteristic is used to send..." ;
                           skos:inScheme ble: ;
                           skos:broader ble:Characteristic ;
                           skos:related ble:IntermediateTemperatureValueField,
                                        ble:TemperatureMeasurementValueField,
                                        ble:Indicate,
                                        ble:TimeStampField ;
                           ontolex:isEvokedBy <tag:temperature%20measurement> ;
                           skos:closeMatch wd:Q909741 . # Wikidata entity: 'temperature measurement'

<tag:temperature%20measurement> a ontolex:LexicalEntry ;
                                rdfs:label "temperature measurement" ;
                                ontolex:denotes wd:Q909741 .
```
