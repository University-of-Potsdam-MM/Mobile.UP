/*

## Dependencies
- jQuery
- moment.js

## Working Functionality
- make ajax POST request
- map API XML data into JavaScript objects
- moment.js parses and formats timestrings
- started Backbone View

## TODO
- create an object to encapsulate the API (e.g. Pagination)
- Backbone-ify views and models
- user should be able to change from where she wants to depart

*/

"use strict";

console.log('loading nahverkehr-logic.js');
console.log('dependencies:', moment, jQuery);

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

  // console.log(requestExternalId(haltestelle));

  // Suche abgehende Verbindungen
  function abgehendeVerbindungen(externalId, timeString){
    var xml =
      tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
        tag('STBReq',{boardType:"DEP", maxJourneys:"5", sortOrder:"REALTIME"},
          tag('Time', {}, timeString),
          tag('Today', {}),
          tag('TableStation', {externalId:externalId}),
          tag('ProductFilter', {}, '1111111111111111')
        )
      );
    return xmlString(xml);
  }

  // console.log(abgehendeVerbindungen(externalId, moment().format('HH:mm:ss')));


  $.post(
    endpoint(),
    requestExternalId(haltestelle),
    function(data, textStatus, jqXHR){
      // console.log('requestExternalId', data,textStatus,jqXHR);
    },
    'xml');

  function parseTime(timeString) {
    var time = moment(timeString, 'DD.MM.YY[T]HH:mm');
    // console.log('parseTime', timeString, time);
    return time;
  }

  function mapSTBJourney(journey){
    var $journey = $(journey);
    var tmp = {
      id:            $journey.attr('trainId'),
      stationName:   $journey.find('MainStop Station').attr('name'),
      departingTime: parseTime($journey.find('Dep > Time').html()),
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

  window.Transport = {
    collection: {},
    views: {},
    view: {},
  };

  Transport.collection.TransportsCollection = new Backbone.Collection();
  var collection = Transport.collection.TransportsCollection;
  collection.on('add', function(journey){
    console.log(journey.attributes);
    console.log("next departure " + journey.get('departingTime').fromNow())
  });


  Transport.views.TransportList = Backbone.View.extend({
    initialize: function() {
      var transports = this.collection;
      transports.on("reset", this.render, this);
      transports.on("add", this.addOne, this);
    },
    addOne: function(t) {
      // console.log('addOne', t);
      this.$el.find('ul').append('<li class="ui-li-static ui-body-inherit"><p><span class="marker open"></span> ' + 
        t.get('departingTime').fromNow() +'&nbsp;' + t.get('name') +
        ' von ' + t.get('stationName') +
        ' nach ' + t.get('direction')+'</p></li>');
    },
    render: function() {
      this.collection.each(this.addOne);
    }
  });

  var nowTimeString = moment().format('HH:mm:ss');
  // console.log('nowTimeString',nowTimeString);
  $.post(
    endpoint(),
    abgehendeVerbindungen(externalId, nowTimeString), 'xml'
  ).done(function(data, textStatus, jqXHR){
      // console.log('abgehendeVerbindungen', data,textStatus,jqXHR);
      var $data = $(data);
      // map every node of STBJourney to a JavaScript Object
      var jsonArray = _.map($data.find('STBJourney'), mapSTBJourney);
      collection.add(jsonArray);
      // console.log('done', collection);
      return collection;
    }
  );


  $(document).on("pageinit", "#transport", function () {
    console.log('pageinit #transport');

    Transport.view.TransportList = new Transport.views.TransportList({
      el: $('#search-results'),
      collection: collection,
    });

  });

})(jQuery);





