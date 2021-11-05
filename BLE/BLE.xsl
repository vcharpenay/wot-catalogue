<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#"
    xmlns:ble="http://purl.org/wot-catalogue/ble#"
    xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#"
    xmlns:prov="http://www.w3.org/ns/prov#"
    version="1.0">

<!-- configuration boilerplate -->
    <xsl:output encoding="UTF-8" indent="yes" method="xml" normalization-form="NFC" />
    <xsl:strip-space elements="*"/>

    <xsl:template match="/">
        <rdf:RDF>
            <xsl:apply-templates select="//Service"/>
            <xsl:apply-templates select="/Characteristic"/>
            <xsl:apply-templates select="//Value/Field"/>
        </rdf:RDF>
    </xsl:template>

    <xsl:template name="service-tpl" match="//Service">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/ble#{@uuid}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:choose>
                    <xsl:when test="boolean(InformativeText/Summary)">
                        <xsl:value-of select="InformativeText/Summary"/>
                    </xsl:when>
                    <xsl:when test="boolean(InformativeText/Abstract)">
                        <xsl:value-of select="InformativeText/Abstract"/>
                    </xsl:when>
                </xsl:choose>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/ble#Service"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/ble#Scheme"/> 
            <!-- skos:related -->
            <xsl:for-each select="Characteristics/Characteristic">
                <skos:related rdf:resource="http://purl.org/wot-catalogue/ble#{@type}"/>
            </xsl:for-each>
        </rdf:Description>
        <!-- Apply the template to create triples corresponding to the characteristics' properties, stored in the Service files -->
        <xsl:apply-templates select="Characteristics/Characteristic"/>
    </xsl:template>

    <!-- template for the characteristic elements within the service files -->
    <xsl:template name="service-characteristic-tpl" match="Characteristics/Characteristic">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/ble#{@type}">
            <xsl:for-each select="Properties/*[text()]">
                <xsl:if test=". != 'Excluded'">
                    <skos:related rdf:resource="http://purl.org/wot-catalogue/ble#{name(.)}"/>
                </xsl:if>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

    <!-- template for the characteristics described by characteristics files --> 
    <xsl:template name="characteristic-tpl" match="/Characteristic">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/ble#{@type}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:choose>
                    <xsl:when test="boolean(InformativeText/Summary)">
                        <xsl:value-of select="InformativeText/Summary"/>
                    </xsl:when>
                    <xsl:when test="boolean(InformativeText/Abstract)">
                        <xsl:value-of select="InformativeText/Abstract"/>
                    </xsl:when>
                </xsl:choose>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/ble#Characteristic"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/ble#Scheme"/> 
            <!-- skos:related -->
            <xsl:for-each select="Value/Field">
                <xsl:variable name="name" select="translate(normalize-space(@name), ' ', '')"/>
                    <skos:related rdf:resource="http://purl.org/wot-catalogue/ble#{$name}"/>
            </xsl:for-each>
        </rdf:Description>
    </xsl:template>

    <xsl:template name="value-tpl" match="//Value/Field">
        <rdf:Description rdf:about="http://purl.org/wot-catalogue/ble#{translate(normalize-space(@name), ' ', '')}">
            <!-- rdf:type -->
            <rdf:type rdf:resource="http://www.w3.org/2004/02/skos/core#Concept"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/prov#Entity"/>
            <rdf:type rdf:resource="http://www.w3.org/ns/lemon/ontolex#LexicalConcept"/>
            <!-- skos:prefLabel and skos:definition -->
            <skos:prefLabel>
                <xsl:value-of select="@name"/>
            </skos:prefLabel>
            <skos:definition>
                <xsl:value-of select="InformativeText"/>
            </skos:definition>
            <!-- skos:broader and skos:inScheme -->
            <skos:broader rdf:resource="http://purl.org/wot-catalogue/ble#Value"/>
            <skos:inScheme rdf:resource="http://purl.org/wot-catalogue/ble#Scheme"/> 
        </rdf:Description>
    </xsl:template>
</xsl:stylesheet>
