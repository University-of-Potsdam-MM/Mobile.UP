define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'moment'
], function($, _, Backbone, utils, moment){

  function endpoint(){
      // return 'http://demo.hafas.de/openapi/vbb-proxy/';
      return 'https://esb.soft.cs.uni-potsdam.de:8243/services/transportTestAPI/';
  }

///////////////////////////////////////////////////////////////////// --> Nächste Abfahrten:
  var Departure = Backbone.Model.extend({
    defaults:{ "time": ""}
  });

  var Departures = Backbone.Collection.extend({
    model: Departure
  });

  var TransportStation = Backbone.Model.extend({
    defaults:{
      "campus": "",
      "name": "",
      "externalId": ""
    },

    url: endpoint()+"departureBoard",

    initialize: function(){
      this.set('departures', new Departures);
    },

    getMaxDepartingTime: function(){
      var times= _.map(this.get('departures').pluck('time'), function(time){return moment(time,'HH:mm');})
      times.push(moment()); // add now()
      var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
      var max = _.last(sortedTimes);
      return max;

    },

    getMinDepartingTime: function(){
      var times= _.map(this.get('departures').pluck('time'), function(time){return moment(time,'HH:mm');})
      times.push(moment()); // add now()
      var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
      var min = _.first(sortedTimes);
      return min;
    },

    parse: function(data, options){
      this.get('departures').add(data.Departure);
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

      initialize: function(){
        this.add(new TransportStation({campus: "G-see", name: "S Griebnitzsee Bhf", externalId: "009230003"}));
        this.add(new TransportStation({campus: "Golm", name: "Potsdam, Golm Bhf", externalId: "009220010"}));
        this.add(new TransportStation({campus: "Palais", name: "Potsdam, Neues Palais", externalId: "009230132"}));
      },

      fetch: function(){
        this.trigger("request");
        var that = this;

        var successORerror = _.after(3, function(){
          that.trigger("sync");
        });

        _.each(this.models, function(model){
          // get the time of last known departure
          var lastDepartingTime = model.getMaxDepartingTime().add(1,'minute');
          var timeString = lastDepartingTime.format('HH:mm:ss');

          model.fetch({ data: abgehendeVerbindungen(model.get('externalId'), timeString),
                        dataType: 'json',
                        success: function(){ successORerror(); },
                        error: function(error, a, b){
                          var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Die Transportsuche ist momentan nicht verfügbar', module: 'transport'});
                          successORerror();
                        }
                      });
        });
      }
  });

  // Suche abgehende Verbindungen
  function abgehendeVerbindungen(externalId, timeString){
    return { accessId: '41f30658-b439-4529-9922-beb13567932c', //TODO: HIDE?!?!
          format: 'json', 
          id: externalId,
          time: timeString};
  }


///////////////////////////////////////////////////////////////////// --> Fahrt Planen:
  var Connection = new Backbone.Model.extend({
    defaults: {
      "originId": "",
      "destId": "",
      "time": ""}
  });

  // var Connections = new Backbone.Collection.extend({
  //   model: Connection;
  // });


  /**
   *  Helper Functions
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

  // Suche Verbindung mit zwei IDs
  function verbindungVonNach(fromExternalId, toExternalId, timeString){
    return { accessId: '41f30658-b439-4529-9922-beb13567932c', //TODO: HIDE?!?!
          format: 'json', 
          originId: fromExternalId,
          destId: toExternalId,
          time: timeString};
  }

  // function verbindungVonNach(fromExternalId, toExternalId, moment) {

  //   var rflags = tag('RFlags', {b: 0, f: 5, a: 0 })

  //   var xml =
  //     tag('ConReq', {},
  //       tag('Start', {},
  //         tag('Station',{externalId: fromExternalId}),
  //         tag('Prod')
  //       ),
  //       tag('Dest', {},
  //         tag('Station',{externalId: toExternalId})
  //       ),
  //       tag('ReqT', {date: moment.format('YYYYMMDD'), time: moment.format('HH:mm')}),
  //       rflags
  //     );
  //   return xmlString(xml);
  // };

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

  var getVerbindung = function(fromExternalId, toExternalId, moment) {
    var defer = $.Deferred();

    ajax(verbindungVonNach(fromExternalId, toExternalId, moment))
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

  // function getExternalId(stationString) {
  //   var defer = $.Deferred();

  //   $.ajax(requestExternalId(stationString))
  //     .done(function(data, textStatus, jqXHR){
  //       var $data = $(data);
  //       var station = $data.find('Station').first();
  //       defer.resolve({
  //         name:       station.attr('name'),
  //         externalId: station.attr('externalId'),
  //       });
  //     })
  //     .fail(function(error){
  //       var errorPage = new utils.ErrorView({el: '#search-results', msg: 'Der Dienst des öffentlichen Nahverkehrs ist momentan nicht erreichbar.', module: 'transport', err: error});
  //     });
  //   return defer.promise();
  // }

  function parseDate(yyyymmdd) {
    return moment(yyyymmdd,'YYYYMMDD');
  }


  return {
    TransportStations: TransportStations,
    getVerbindung: getVerbindung
  };

});