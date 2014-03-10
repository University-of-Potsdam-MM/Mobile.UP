"use strict";

var accessId = 'Access-ID siehe E-Mail';
var endpoint = 'http://demo.hafas.de/bin/pub/vbb/extxml.exe';




// use this document for creating XML
var doc = document.implementation.createDocument(null, null, null);

// function that creates the XML structure
function tag() {
    var node = doc.createElement(arguments[0]), text, child;

    // TODO: add xml attributes

    for(var i = 1; i < arguments.length; i++) {
        child = arguments[i];
        if(typeof child == 'string') {
            child = doc.createTextNode(child);
        }
        node.appendChild(child);
    }

    return node;
};

// create the XML structure recursively
var xml =
tag('report',
    tag('submitter',
        tag('name', 'John Doe')
    ),
    tag('students',
        tag('student',
            tag('name', 'Alice'),
            tag('grade', '80')
        ),
        tag('student',
            tag('name', 'Bob'),
            tag('grade', '90')
        )
    )
);

var string = new XMLSerializer().serializeToString(xml);


/*
<?xml version="1.0" encoding="iso-8859-1"?>
<ReqC ver="1.1" prod="String" rt="yes" lang="DE" accessId="Access-ID siehe E-Mail">
    <LocValReq id="001" maxNr="20" sMode="1">
        <ReqLoc type="ST" match="Lindenallee" />
    </LocValReq>
</ReqC>
*/

// Suche abgehende Verbindungen
/*
<?xml version="1.0" encoding="utf-8"?>
<ReqC ver="1.1" prod="String" rt="no" lang="DE" accessId="Access-ID siehe E-Mail">
    <STBReq boardType="DEP" maxJourneys="5" sortOrder="REALTIME">
        <Time>16:00:00</Time>
        <Today />
        <TableStation externalId="009230133#86"/>
        <ProductFilter>1111111111111111</ProductFilter>
    </STBReq>
</ReqC>
*/

console.log(string);
