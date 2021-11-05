<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:lwm2m="http://purl.org/wot-catalogue/lwm2m#"
    xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#"
    xmlns:prov="http://www.w3.org/ns/prov#"
    version="1.0">

<!-- configuration boilerplate -->
  <xsl:output encoding="UTF-8" indent="yes" method="xml" normalization-form="NFC" />
  <xsl:strip-space elements="*"/>

  <xsl:template match="/">
    <rdf:RDF>
      <rdf:Description rdf:about="{base-uri()}">
        <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
      </rdf:Description>
      <xsl:apply-templates select="//Object"/>
    </rdf:RDF>
  </xsl:template>

  <xsl:template name="object-tpl" match="//Object">
    <rdf:Description rdf:about="http://purl.org/wot-catalogue/lwm2m#{ObjectID}">
      <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
      <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
      <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
      <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
      <skos:prefLabel>
        <xsl:value-of select="Name"/>
      </skos:prefLabel>
      <skos:definition>
        <xsl:value-of select="Description1"/>
      </skos:definition>
      <skos:broader rdf:resource="http://purl.org/wot-catalogue/lwm2m#Object"/>
      <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/lwm2m#Scheme"/> 
      <xsl:for-each select="Resources/Item">
        <xsl:choose>
          <xsl:when test="@ID &lt; 2048">
            <skos:related rdf:resource="http://purl.org/wot-catalogue/lwm2m#r{ancestor::Object/ObjectID}-{@ID}"/>
          </xsl:when>
          <xsl:otherwise>
            <skos:related rdf:resource="http://purl.org/wot-catalogue/lwm2m#r{@ID}"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
    </rdf:Description>
    <!-- Creating a variable to store the corresponding collection id -->
    <xsl:variable name="coll">
      <xsl:choose>
        <xsl:when test="ObjectID &lt; 500">
          <xsl:value-of select="'dmse'"/>
        </xsl:when>
        <xsl:when test="ObjectID &lt; 1024">
          <xsl:value-of select="'ipso'"/>
        </xsl:when>
        <xsl:when test="ObjectID &gt; 2047 and ObjectID &lt; 10241">
          <xsl:value-of select="'ext'"/>
        </xsl:when>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="ObjID" select="ObjectID"/>
    <rdf:Description rdf:about="http://purl.org/wot-catalogue/lwm2m#{$coll}">
      <skos:member rdf:resource="http://purl.org/wot-catalogue/lwm2m#{$ObjID}"/>
    </rdf:Description>
    <xsl:apply-templates select="//Item"/>
  </xsl:template>

  <xsl:template name="resource-tpl" match="//Item">
    <xsl:variable name="iri">
      <xsl:choose>
        <xsl:when test="@ID &lt; 2048">
          <xsl:value-of select="concat(ancestor::Object/ObjectID,'-',@ID)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="@ID"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <rdf:Description rdf:about="http://purl.org/wot-catalogue/lwm2m#r{$iri}">
      <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
      <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
      <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
      <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
      <skos:prefLabel>
        <xsl:value-of select="Name"/>
      </skos:prefLabel>
      <skos:definition>
        <xsl:value-of select="Description"/>
      </skos:definition>
      <skos:broader rdf:resource="http://purl.org/wot-catalogue/lwm2m#Resource"/>
      <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/lwm2m#Scheme"/>
      <skos:related rdf:resource="http://purl.org/wot-catalogue/lwm2m#{Operations}"/>
    </rdf:Description>
    <!-- Attributing the collection based on the resource ID -->
    <xsl:variable name="collectionIRI2">
      <xsl:choose>
        <xsl:when test="@ID &lt; 2048">
          <xsl:value-of select="'common_resource'"/>
        </xsl:when>
        <xsl:when test="ObjectID &lt; 26241">
          <xsl:value-of select="'reusable_resource'"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="'private_resource'"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <rdf:Description rdf:about="http://purl.org/wot-catalogue/lwm2m#{$collectionIRI2}">
      <skos:member rdf:resource="http://purl.org/wot-catalogue/lwm2m#r{$iri}"/>
    </rdf:Description>
  </xsl:template>
</xsl:stylesheet>
