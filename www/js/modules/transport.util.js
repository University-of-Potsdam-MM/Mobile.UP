define(['jquery', 'underscore', 'backbone', 'utils', 'moment'], function($, _, Backbone, utils, moment){

	function endpoint(){
      return 'http://api.uni-potsdam.de/endpoints/transportAPI/1.0/';
  }

  function ajax(xmlPayload) {
    return $.ajax({
      type: "POST",
      url: endpoint(),
      crossDomain: true,
      data: xmlPayload,
      contentType: 'text/xml',
      dataType: 'xml',
      beforeSend: function (request) {
          request.withCredentials = true;
          request.setRequestHeader("Authorization", utils.getAuthHeader());
      },
    });
  }

  // var haltestelle = 'Potsdam, Campus Universität/Lindenallee';
  // var externalId = "009230133#86";
  var TransportStation = Backbone.Model.extend({
    defaults:{
      "campus": "",
      "name": "",
      "externalId": ""
    },

    url: 'http://api.uni-potsdam.de/endpoints/transportAPI/1.0/',

    initialize: function(){
      this.set('journeys', new Journeys);
    },

    getMaxDepartingTime: function(){
      var times = this.get('journeys').pluck('departingTime');
      times.push(moment()); // add now()
      var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
      var max = _.last(sortedTimes);
      return max;
    },

    getMinDepartingTime: function(){
      var times = this.get('journeys').pluck('departingTime');
      times.push(moment()); // add now()
      var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
      var min = _.first(sortedTimes);
      return min;
    },

		parse: function(data, options){
      var $data = $(data);
      // map every node of STBJourney to a JavaScript Object
      var jsonArray = _.map($data.find('STBJourney'), mapSTBJourney);
      this.get('journeys').add(jsonArray);
      this.set('stationTime', this.getMinDepartingTime().format('HH:mm') + " - " + this.getMaxDepartingTime().format('HH:mm'));
      return this;
		}
  });

  /**
   *  Backbone Collection - TransportStations
   *  holding all stations and delegates fetch to station models
   */
  var TransportStations = Backbone.Collection.extend({

      model: TransportStation,

      fetch: function(){
      	this.trigger("request");
      	var that = this;

      	var successORerror = _.after(3, function(){
      		that.trigger("sync");
      	});

        _.each(this.models, function(model){
        	//console.log('fetching station:', model.get('name'));

      		// get the time of last known journey
      		var lastDepartingTime = model.getMaxDepartingTime();
      		var timeString = lastDepartingTime.format('HH:mm:ss');

          model.fetch({	data: abgehendeVerbindungen(model.get('externalId'), timeString),
          							type: 'POST',
          							contentType: 'text/xml',
          							dataType: 'xml',
          							crossDomain: true,
          							success: function(){ successORerror(); },
          							error: function(error, a, b){
          								var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Die Transportsuche ist momentan nicht verfügbar', module: 'transport'});
          								successORerror();
          							}});
        });
      }
  });

  var Journey = Backbone.Model.extend({
    defaults:{ "departingTime": ""}
  });

  var Journeys = Backbone.Collection.extend({
    model: Journey
  });

  var stations = new TransportStations([
    new TransportStation({campus: "G-see", name: "S Griebnitzsee Bhf", externalId: "009230003#86"}),
    new TransportStation({campus: "Golm", name: "Potsdam, Golm Bhf", externalId: "009220010#86"}),
    new TransportStation({campus: "Palais", name: "Potsdam, Neues Palais", externalId: "009230132#86"})
  ]);


  var Connection = new Backbone.Model.extend({
  	defaults: {
  		"fromExternalId": "",
  		"toExternalId": "",
  		"moment": "",
  		"arrivalMode": ""
  	},

  	url: 'http://api.uni-potsdam.de/endpoints/transportAPI/1.0/',


  	parse: function(){

	    ajax(verbindungVonNach(fromExternalId, toExternalId, moment, arrivalMode))
	    .done(function(data, textStatus, jqXHR){
	      var $data = $(data);
	      var connections = _.map($data.find('Connection'), mapConnection);
	      // TODO: map connections from xml to objects
	      defer.resolve(connections);
	    })
	    .fail(function(error){
	    	var errorPage = new utils.ErrorView({el: '#result', msg: 'Der Dienst des öffentlichen Nahverkehrs ist momentan nicht erreichbar.', module: 'transport2', err: error});
	    });

  	}
  });


  /**
   *
   *  Helper Functions
   *
   */
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
      tag('LocValReq', {id:'001', maxNr:20, sMode:1},
         tag('ReqLoc', {type:'ST', match:location})
      );
    return xmlString(xml);
  }

  // Suche abgehende Verbindungen
  function abgehendeVerbindungen(externalId, timeString){
    var xml =
      tag('STBReq',{boardType:"DEP", maxJourneys:"5", sortOrder:"REALTIME"},
        tag('Time', {}, timeString),
        tag('Today', {}),
        tag('TableStation', {externalId:externalId}),
        tag('ProductFilter', {}, '1111111111111111')
      );
    return xmlString(xml);
  }

  // Suche Verbindung mit zwei IDs
  function verbindungVonNach(fromExternalId, toExternalId, moment, arrivalMode) {

    var rflags;
    if ('1' == arrivalMode) {
      rflags = tag('RFlags', {b: 5, f: 0, a: 0 })
    } else {
      // default
      rflags = tag('RFlags', {b: 0, f: 5, a: 0 })
    }

    var xml =
      tag('ConReq', {},
        tag('Start', {},
          tag('Station',{externalId: fromExternalId}),
          tag('Prod')
        ),
        tag('Dest', {},
          tag('Station',{externalId: toExternalId})
        ),
        tag('ReqT', {date: moment.format('YYYYMMDD'), time: moment.format('HH:mm')}),
        rflags
      );
    return xmlString(xml);
  };

  // maps a Time string like '00d:00:15:00' into a momentjs duration
  // var m = moment().add(parseDuration("00d00:10:00"));
  // console.log(m.format('HH:mm'));
  function parseDuration(durationString) {
    if (durationString) {
      var duration = durationString.replace('d', '.');
      return moment.duration(duration);
    }
  }

  // date is a moment.js Date and
  // we should NEVER CHANGE it!
  function datetime(date, timeString) {
    var copyDate = moment(date);
    var duration = parseDuration(timeString);
    return copyDate.add(duration);
  }

  function mapConnectionOverview(overview) {
    var $overview = $(overview);

    var dateString = $overview.find('Date').text();
    var date = parseDate(dateString);

    var mapped = {
      date: date,

      depStation: $overview.find('Departure BasicStop Station').attr('name'),
      depPlatform:$overview.find('Departure BasicStop Dep Platform Text').text(),
      depTime:    datetime(date, $overview.find('Departure BasicStop Dep Time').text()),

      arrStation: $overview.find('Arrival BasicStop Station').attr('name'),
      arrPlatform:$overview.find('Arrival BasicStop Arr Platform Text').text(),
      arrTime:    datetime(date, $overview.find('Arrival BasicStop Arr Time').text()),

      duration:   parseDuration($overview.find('Duration Time').text()),
    };

    return mapped;
  }

  /**
   *  @returns mapped
   *  @description mapping overview to connection section
   */
  function mapConnectionSection(overview, date) {
    var $overview = $(overview);

    var mapped = {
      date: date,
      depStation: $overview.find('Departure BasicStop Station').attr('name'),
      depPlatform:$overview.find('Departure BasicStop Dep Platform Text').text(),
      depTime:    datetime(date, $overview.find('Departure BasicStop Dep Time').text()),

      arrStation: $overview.find('Arrival BasicStop Station').attr('name'),
      arrPlatform:$overview.find('Arrival BasicStop Arr Platform Text').text(),
      arrTime:    datetime(date, $overview.find('Arrival BasicStop Arr Time').text()),
    };

    return mapped;
  }


  function mapConSections(sectionsArr, mDate) {

    var mapped = _.map(sectionsArr, function(section) {
      // console.log(section);
      var mappedSection = _.extend(
        mapConnectionSection(section, mDate),
        {journey: mapSTBJourney($(section).find("Journey"))}
      );
      return mappedSection;
    });

    return mapped
  }

  function mapConnection(connection){
    var $con = $(connection);
    var myCon = {
      id: $con.attr('id'),
    };

    var overview = $con.find('Overview').first();
    _.extend(myCon, mapConnectionOverview(overview));

    var date = myCon.date;

    _.extend(myCon, {sections: mapConSections($con.find('ConSection'), date)});

    return myCon;
  }

  var getVerbindung = function(fromExternalId, toExternalId, moment, arrivalMode) {
    var defer = $.Deferred();

    ajax(verbindungVonNach(fromExternalId, toExternalId, moment, arrivalMode))
    .done(function(data, textStatus, jqXHR){
      var $data = $(data);
      var connections = _.map($data.find('Connection'), mapConnection);
      // TODO: map connections from xml to objects
      defer.resolve(connections);
    })
    .fail(function(error){
    	var errorPage = new utils.ErrorView({el: '#result', msg: 'Der Dienst des öffentlichen Nahverkehrs ist momentan nicht erreichbar.', module: 'transport2', err: error});
    });


    return defer.promise();
  }

  // getVerbindung(stations['G-see'].externalId, stations['Golm'].externalId, moment())
  //   .done(function(data){
  //     console.log('debugging', data);
  //   });

  function getExternalId(stationString) {
    var defer = $.Deferred();

    $.ajax(requestExternalId(stationString))
      .done(function(data, textStatus, jqXHR){
        var $data = $(data);
        var station = $data.find('Station').first();
        defer.resolve({
          name:       station.attr('name'),
          externalId: station.attr('externalId'),
        });
      })
      .fail(function(error){
		    var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Der Dienst des öffentlichen Nahverkehrs ist momentan nicht erreichbar.', module: 'transport', err: error});
      });
    return defer.promise();
  }

  // getExternalId('Griebnitzsee').done(function(){console.log('G-see', arguments)});
  // getExternalId('Golm, Bahnhof').done(function(){console.log('Golm', arguments)});
  // getExternalId('Neues Palais').done(function(){console.log('Neues Palais', arguments)});

  function parseDate(yyyymmdd) {
    return moment(yyyymmdd,'YYYYMMDD');
  }

  function parseTime(timeString) {
    var time = moment(timeString, 'DD.MM.YY[T]HH:mm');
    return time;
  }

  function mapSTBJourney(journey){
    var $journey = $(journey);
    var tmp = {
      id:               $journey.attr('trainId'),
      stationName:      $journey.find('MainStop Station').attr('name'),
      departingTime:    parseTime($journey.find('MainStop BasicStop Dep Time').text()),
      name:             $journey.find('JourneyAttribute Attribute[type=NAME] Text').text(),
      category:         $journey.find('JourneyAttribute Attribute[type=CATEGORY] Text').text(),
      internalcategory: $journey.find('JourneyAttribute Attribute[type=INTERNALCATEGORY] Text').text(),
      operator:         $journey.find('JourneyAttribute Attribute[type=OPERATOR] Text').text(),
      number:           $journey.find('JourneyAttribute Attribute[type=NUMBER] Text').text(),
      direction:        $journey.find('JourneyAttribute Attribute[type=DIRECTION] Text').text(),
      directionflag:    $journey.find('JourneyAttribute Attribute[type=DIRECTIONFLAG] Text').text(),
      directioncode:    $journey.find('JourneyAttribute Attribute[type=DIRECTIONCODE] Text').text(),
      normal:           $journey.find('JourneyAttribute Attribute[type=NORMAL] Text').text(),
    };
    return tmp;
  };

  return {
    stations: function() {return stations;},
    getVerbindung: getVerbindung
  };

});