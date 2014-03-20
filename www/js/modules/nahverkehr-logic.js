/*

## TODO
- add moment.js to construct timestring
- create an object to encapsulate the API
- Backbone-ify views and models

*/

"use strict";

console.log('loading nahverkehr-logic.js');

var environment = 'development';
var accessId = 'kiy4e84a4b832962eea1943106096116';

function endpoint(){
  if ('development' == environment){
    return '/api/transport/bin/pub/vbb/extxml.exe';
  } else {
    return 'http://demo.hafas.de/bin/pub/vbb/extxml.exe';
  }
}

// use this document for creating XML
var doc = document.implementation.createDocument(null, null, null);

// function that creates the XML structure
function tag(nodeName, attributes) {
  var node = doc.createElement(nodeName), text, child;

  _.each(attributes, function(value, key){
    node.setAttribute(key, value);
  });

  for(var i = 2; i < arguments.length; i++) {
    child = arguments[i];
    if(typeof child == 'string') {
      child = doc.createTextNode(child);
    }
    node.appendChild(child);
  }

  return node;
};

function xmlString(xml) {
  return '<?xml version="1.0" encoding="UTF-8" ?>\n' + new XMLSerializer().serializeToString(xml);
}

function requestExternalId(){
  var xml =
    tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
      tag('LocValReq', {id:'001', maxNr:20, sMode:1},
        tag('ReqLoc', {type:'ST', match:'Lindenallee'})
      )
    );
  return xmlString(xml);
}

console.log(requestExternalId());

// Suche abgehende Verbindungen
function abgehendeVerbindungen(){
  var xml =
    tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
      tag('STBReq',{boardType:"DEP", maxJourneys:"5", sortOrder:"REALTIME"},
        tag('Time', {}, '16:00:00'),
        tag('Today', {}),
        tag('TableStation', {externalId:"009230133#86"}),
        tag('ProductFilter', {}, '1111111111111111')
      )
    );
  return xmlString(xml);
}

console.log(abgehendeVerbindungen());
