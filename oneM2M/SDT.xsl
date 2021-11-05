<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:sdt="http://purl.org/wot-catalogue/sdt#"
    xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#"
    xmlns:hgi="http://homegatewayinitiative.org/xml/dal/3.0"
    xmlns:prov="http://www.w3.org/ns/prov#"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    version="1.0">

<!-- configuration boilerplate -->
    <xsl:output encoding="UTF-8" indent="yes" method="xml" normalization-form="NFC" />
    <xsl:strip-space elements="*"/>

    <xsl:template match="/">
        <rdf:RDF>
            <rdf:Description rdf:about="{base-uri()}">
                <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            </rdf:Description>
            <xsl:apply-templates select="//hgi:Device"/>
            <xsl:apply-templates select="//hgi:SubDevice"/>
            <xsl:apply-templates select="//hgi:ModuleClass"/>
            <xsl:apply-templates select="//hgi:DataPoint"/>
            <xsl:apply-templates select="//hgi:Action"/>
            <xsl:apply-templates select="//xs:simpleType"/>
            <xsl:apply-templates select="//xs:restriction/xs:enumeration"/>
        </rdf:RDF>
    </xsl:template>

    <xsl:template name="device-tpl" match="//hgi:Device">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{@id}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@id"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="hgi:Doc"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/sdt#Device"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
            <!-- skos:related-->
            <xsl:for-each select="hgi:Modules/hgi:Module">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{@name}"/>
            </xsl:for-each>
            <xsl:for-each select="hgi:SubDevices/hgi:SubDevice">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{@id}"/>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="subdevice-tpl" match="//hgi:SubDevice">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{@id}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@id"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="hgi:Doc"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/sdt#Device"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
            <!-- skos:related-->
            <xsl:for-each select="hgi:Modules/hgi:Module">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{@name}"/>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="moduleclass-tpl" match="//hgi:ModuleClass">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{@name}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="hgi:Doc"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/sdt#Module"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
            <!-- skos:related-->
            <xsl:for-each select="hgi:Actions/hgi:Action | hgi:Data/hgi:DataPoint">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{ancestor::hgi:ModuleClass/@name}-{@name}"/>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="datapoint-tpl" match="//hgi:DataPoint">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{ancestor::hgi:ModuleClass/@name}-{@name}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="hgi:Doc"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/sdt#DataPoint"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
            <!-- skos:related-->
            <xsl:variable name="datatype" select="hgi:DataType/hgi:SimpleType/@type"/>
            <xsl:choose>
                <xsl:when test="$datatype = 'datetime'">
                    <skos:related rdf:resource="http://www.w3.org/2001/XMLSchema#dateTime"/>
                </xsl:when>
                <xsl:when test="$datatype = 'float' or $datatype = 'integer' or $datatype = 'boolean' or $datatype = 'string' or $datatype = 'date' or $datatype = 'time'">
                    <skos:related rdf:resource="http://www.w3.org/2001/XMLSchema#{$datatype}"/>
                </xsl:when>
                <xsl:otherwise>
                    <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{substring-after($datatype, 'hd:')}"/>
                </xsl:otherwise>
            </xsl:choose>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="action-tpl" match="//hgi:Action">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{ancestor::hgi:ModuleClass/@name}-{@name}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="hgi:Doc"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/sdt#Action"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="enumtype-tpl" match="//xs:restriction/xs:enumeration">
        <xsl:variable name="typename" select="ancestor::xs:simpleType/@name"/>
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{ancestor::xs:simpleType/@name}-{@value}">
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <skos:prefLabel>
                <!-- from https://stackoverflow.com/questions/2991141/xslt-xpath-match-directly-preceding-comments -->
                <xsl:value-of select="preceding-sibling::comment()[
    generate-id(following-sibling::*[1]) = generate-id(current())
  ]"/>
            </skos:prefLabel>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="simpletype-tpl" match="//xs:simpleType">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/sdt#{@name}">
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <prov:wasDerivedFrom rdf:resource="{base-uri()}"/>
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="xs:annotation/xs:documentation"/>
            </skos:definition>
            <xsl:variable name="type" select="substring-after(xs:restriction/@base,'xs:')"/>
            <skos:broader rdf:resource="http://www.w3.org/2001/XMLSchema#{$type}"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/sdt#Scheme"/>
            <xsl:for-each select="xs:restriction/xs:enumeration">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/sdt#{ancestor::xs:simpleType/@name}-{@value}"/>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

</xsl:stylesheet>
