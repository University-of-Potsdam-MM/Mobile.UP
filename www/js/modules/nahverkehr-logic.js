/*

## Working Functionality
- make ajax POST request
- map API XML data into javascript object

## TODO
- create an object to encapsulate the API
- add moment.js to parse and construct timestrings
- Backbone-ify views and models

*/

"use strict";

console.log('loading nahverkehr-logic.js');

(function($){

  // TODO add Backbone code here

  // API code
  var environment = 'development';
  var accessId = 'kiy4e84a4b832962eea1943106096116';

  var haltestelle = 'Potsdam, Campus Universität/Lindenallee';
  var externalId = "009230133#86";

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

  function requestExternalId(location){
    var xml =
      tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
        tag('LocValReq', {id:'001', maxNr:20, sMode:1},
          tag('ReqLoc', {type:'ST', match:location})
        )
      );
    return xmlString(xml);
  }

  console.log(requestExternalId(haltestelle));

  // Suche abgehende Verbindungen
  function abgehendeVerbindungen(externalId){
    var xml =
      tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
        tag('STBReq',{boardType:"DEP", maxJourneys:"5", sortOrder:"REALTIME"},
          tag('Time', {}, '16:00:00'),
          tag('Today', {}),
          tag('TableStation', {externalId:externalId}),
          tag('ProductFilter', {}, '1111111111111111')
        )
      );
    return xmlString(xml);
  }

  console.log(abgehendeVerbindungen(externalId));


  $.post(
    endpoint(),
    requestExternalId(haltestelle),
    function(data, textStatus, jqXHR){
      console.log('requestExternalId', data,textStatus,jqXHR);
    },
    'xml');

  function mapSTBJourney(journey){
    var $journey = $(journey);
    var tmp = {
      id:            $journey.attr('trainId'),
      departingTime: $journey.find('Dep > Time').html(),
      name:             $journey.find('JourneyAttribute Attribute[type=NAME] Text').html(),
      category:         $journey.find('JourneyAttribute Attribute[type=CATEGORY] Text').html(),
      internalcategory: $journey.find('JourneyAttribute Attribute[type=INTERNALCATEGORY] Text').html(),
      operator:         $journey.find('JourneyAttribute Attribute[type=OPERATOR] Text').html(),
      number:           $journey.find('JourneyAttribute Attribute[type=NUMBER] Text').html(),
      direction:        $journey.find('JourneyAttribute Attribute[type=DIRECTION] Text').html(),
      directionflag:    $journey.find('JourneyAttribute Attribute[type=DIRECTIONFLAG] Text').html(),
      directioncode:    $journey.find('JourneyAttribute Attribute[type=DIRECTIONCODE] Text').html(),
      normal:           $journey.find('JourneyAttribute Attribute[type=NORMAL] Text').html(),
    };
    return tmp;
  };

  $.post(
    endpoint(),
    abgehendeVerbindungen(externalId),
    function(data, textStatus, jqXHR){
      console.log('abgehendeVerbindungen', data,textStatus,jqXHR);
      var $data = $(data);
      // map every node of STBJourney to a JavaScript Object
      var jsonArray = _.map($data.find('STBJourney'), mapSTBJourney);
      return jsonArray;
    },
    'xml');



  $(document).on("pageinit", "#transport", function () {
    console.log('pageinit #transport');
  });
})(jQuery);





