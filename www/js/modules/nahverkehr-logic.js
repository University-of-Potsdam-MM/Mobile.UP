/*

## Dependencies
- jQuery
- moment.js

## Working Functionality
- make ajax POST request
- map API XML data into JavaScript objects, uses Deferreds
- moment.js parses and formats timestrings
- switch between stations
- 'pagination': get more departing times (journeys)
- started Backbone View
- verbindungVonNach

## TODO
- verbindungVonNach: date + time, pagination
- parsing durations
- better objects
- event 'pagebeforeshow' -> find out if need to fetch journeys
- prevent breaking if buttons are renamed (Button mapping is done by simply using button text. There should be a better mapping method)
*/

"use strict";

console.log('loading nahverkehr-logic.js');
console.log('dependencies:', moment, jQuery);

(function($){

  // TODO add Backbone code here

  // API code
  var environment = 'development';
  var accessId = 'kiy4e84a4b832962eea1943106096116';

  // var haltestelle = 'Potsdam, Campus Universität/Lindenallee';
  // var externalId = "009230133#86";

  var stations = {
    "G-see": {
      name: 'S Griebnitzsee Bhf',
      externalId: '009230003#86',
    },
    "Golm": {
      name: 'Potsdam, Golm Bhf',
      externalId: '009220010#86',
    },
    "Palais": {
      name: 'Potsdam, Neues Palais',
      externalId: '009230132#86',
    },
  };

  // window.App = {
  //   stations: stations
  // };

  _.each(stations, function(station){
    _.extend(station, {
      journeys: new Backbone.Collection(),
      getMaxDepartingTime: function(){
        var times = this.journeys.pluck('departingTime');
        times.push(moment()); // add now()
        var sortedTimes = _.sortBy(times, function(moment){return moment.valueOf()});
        var max = _.last(sortedTimes);
        return max;
      },
      fetchJourneys: function(){
        var station = this;
        // get the time of last known journey
        var moment = station.getMaxDepartingTime();
        // get later journeys
        getLeavingJourneys(station.externalId, moment)
          .done(function(journeys){
            station.journeys.add(journeys);
          });
      }
    });
  });


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


  function verbindungVonNach(fromExternalId, toExternalId, moment) {
    var xml =
      tag('ReqC', {ver:'1.1', prod:'String', rt:'yes', lang:'DE', accessId:accessId},
        tag('ConReq', {},
          tag('Start', {},
            tag('Station',{externalId: fromExternalId}),
            tag('Prod')
          ),
          tag('Dest', {},
            tag('Station',{externalId: toExternalId})
          ),
          tag('ReqT', {date: moment.format('YYYYMMDD'), time: moment.format('HH:mm')}),
          tag('RFlags', {b: 0, f: 5})
        )
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

    var dateString = $overview.find('Date').html();
    var date = parseDate(dateString);

    var mapped = {
      date: date,

      depStation: $overview.find('Departure BasicStop Station').attr('name'),
      depPlatform:$overview.find('Departure BasicStop Dep Platform Text').html(),
      depTime:    datetime(date, $overview.find('Departure BasicStop Dep Time').html()),

      arrStation: $overview.find('Arrival BasicStop Station').attr('name'),
      arrPlatform:$overview.find('Arrival BasicStop Arr Platform Text').html(),
      arrTime:    datetime(date, $overview.find('Arrival BasicStop Arr Time').html()),

      duration:   parseDuration($overview.find('Duration Time').html()),
    };

    return mapped;
  }


  function mapConnectionSection(overview, date) {
    var $overview = $(overview);

    var mapped = {
      date: date,
      depStation: $overview.find('Departure BasicStop Station').attr('name'),
      depPlatform:$overview.find('Departure BasicStop Dep Platform Text').html(),
      depTime:    datetime(date, $overview.find('Departure BasicStop Dep Time').html()),

      arrStation: $overview.find('Arrival BasicStop Station').attr('name'),
      arrPlatform:$overview.find('Arrival BasicStop Arr Platform Text').html(),
      arrTime:    datetime(date, $overview.find('Arrival BasicStop Arr Time').html()),
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
    // console.log('mapConnection', connection);
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

  function getVerbindung(fromExternalId, toExternalId, moment) {
    var defer = $.Deferred();
    $.post(
      endpoint(),
      verbindungVonNach(fromExternalId, toExternalId, moment),
      'xml')
      .done(function(data, textStatus, jqXHR){
        // console.log('requestExternalId', data,textStatus,jqXHR);
        var $data = $(data);
        var connections = _.map($data.find('Connection'), mapConnection);
        // TODO: map connections from xml to objects
        defer.resolve(connections);
      });

    return defer.promise();
  }

  getVerbindung(stations['G-see'].externalId, stations['Golm'].externalId, moment())
    .done(function(data){
      console.log('debugging', data);
    });

  function getExternalId(stationString) {
    var defer = $.Deferred();
    $.post(
      endpoint(),
      requestExternalId(stationString),
      'xml')
      .done(function(data, textStatus, jqXHR){
        // console.log('requestExternalId', data,textStatus,jqXHR);
        var $data = $(data);
        var station = $data.find('Station').first();
        defer.resolve({
          name:       station.attr('name'),
          externalId: station.attr('externalId'),
        });
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
    model: {},
    collection: {},
    views: {},
    view: {},
  };

  Transport.collection.TransportsCollection = new Backbone.Collection();
  var collection = Transport.collection.TransportsCollection;
  collection.on('add', function(journey){
    // console.log(journey.attributes);
    // console.log("next departure " + journey.get('departingTime').fromNow())
  });


  Transport.views.TransportList = Backbone.View.extend({
    initialize: function(options) {
      this.stationName = options.stationName;

      var transports = this.collection;
      transports.on("reset", this.render, this);
      transports.on("add", this.addOne, this);
      _.bindAll(this, 'addOne');
    },
    template: rendertmpl('transport_listitem_view'),
    addOne: function(journey) {
      this.$el.find('ul').append(this.template({journey: journey}));
    },
    render: function() {
      console.log('render');
      this.$el.find('.stationName').html(this.stationName);
      this.$el.find('ul').empty();
      this.collection.each(this.addOne);
      return this;
    }
  });

  // moment should be an instance of moment.js
  function getLeavingJourneys(externalId, moment) {
    var defer = $.Deferred();
    var timeString = moment.format('HH:mm:ss');
    // console.log('timeString',timeString);
    $.post(
      endpoint(),
      abgehendeVerbindungen(externalId, timeString), 'xml'
    ).done(function(data, textStatus, jqXHR){
        // console.log('abgehendeVerbindungen', data,textStatus,jqXHR);
        var $data = $(data);
        // map every node of STBJourney to a JavaScript Object
        var jsonArray = _.map($data.find('STBJourney'), mapSTBJourney);
        defer.resolve(jsonArray);
      }
    );

    return defer.promise();
  }

  var now = moment();

  _.each(stations, function(station){
    station.fetchJourneys();
  })

  var NavigationView = Backbone.View.extend({
    events: {
      "vclick a" : function(ev){
        ev.preventDefault();
        var buttonName = $(ev.target).html();
        this.trigger('select', buttonName);
      }
    }
  });


  Transport.views.ComplexSearchView = Backbone.View.extend({
    initialize: function(){
      var query = this.model;
      var resultList = this.collection;
      resultList.on('reset', this.renderResults, this);
      resultList.on('add', this.render, this);
    },
    events:{
      "vclick #searchButton" : "search",
      "vclick #earlierButton": "searchEarlier",
      "vclick #laterButton"  : "searchLater",
    },
    search: function(){
      console.log('click searchButton');
      this.model.fetchConnections();
      this.renderSummary();
    },
    searchEarlier: function(){
      console.log('click earlierButton');
    },
    searchLater: function(){
      console.log('click laterButton');
    },
    render: function(){
      console.log('render', this.collection);
      // TODO render resultlist
      return this;
    },
    renderSummary:function(){
      var q = this.model;
      this.$el.find('#summary .fromCampus').html(q.fromStation().name);
      this.$el.find('#summary .toCampus').html(q.toStation().name);
      this.$el.find('#summary .when').html(q.get('depTime').format('DD.MM.YY HH:mm'));
    },

    templateListItem: rendertmpl('complex_transport_listitem'),
    renderResults: function(){
      console.log('render results', this.collection);
      // TODO render resultlist
      var view = this;

      var resultList = this.$el.find('#result ul');
      resultList.html('');
      this.collection.each(function(connection){
        var html = view.templateListItem({connection: connection});
        resultList.append(html);
      });
      resultList.trigger('create');
      return this;
    },

  });

  Transport.StateModel = Backbone.Model.extend({
    defaults:{
      depTime: moment(),
      connections: new Backbone.Collection(),
    },
    setTime: function(){console.log('setTime',arguments);},
    setDate: function(){console.log('setDate',arguments);},
    fromStation: function(){
      return stations[this.get('from')]
    },
    toStation: function(){
      return stations[this.get('to')]
    },
    resetConnections: function(newConnections){
      this.get('connections').reset(newConnections);
    },
    fetchConnections: function(){
      var that = this;
      getVerbindung(
        this.fromStation().externalId,
        this.toStation().externalId,
        this.get('depTime')
      ).done(function(connections){
        that.resetConnections(connections);
      });
    }
  });

  $(document).on("pageinit", "#transport", function () {
    console.log('pageinit #transport');

    Transport.view.TransportList = new Transport.views.TransportList({
      el: $('#search-results'),
      events: {
        'vclick #later-button' : function(){
          // we just fetch departing journeys for all stations
          _.each(stations, function(station){
            station.fetchJourneys();
          });
        }
      },
      collection: stations['G-see'].journeys,
      stationName: stations['G-see'].name,
    });
    Transport.view.TransportList.render();

    Transport.view.Navbar = new NavigationView({
      el: $("#from-station-navbar")
    });

    Transport.view.Navbar.on('select', function(buttonName){
      console.log(arguments);
      Transport.view.TransportList.collection = stations[buttonName].journeys;
      Transport.view.TransportList.stationName = stations[buttonName].name;
      Transport.view.TransportList.render();
    });
  });
  // end on pageinit #transport

$(document).on("pageinit", "#transport2", function () {
    console.log('pageinit #transport2');

    Transport.model.State = new Transport.StateModel({
      from: "G-see",
      to: "Palais",
    });

    Transport.view.FromStation = new NavigationView({
      el: $("#fromStation2")
    });

    Transport.view.ToStation = new NavigationView({
      el: $("#toStation2")
    });

    Transport.view.FromStation.on('select', function(buttonName){
      console.log(arguments);
      Transport.model.State.set('from', buttonName);
    });

    Transport.view.ToStation.on('select', function(buttonName){
      console.log(arguments);
      Transport.model.State.set('to', buttonName);
    });

    Transport.view.ComplexSearch = new Transport.views.ComplexSearchView({
      el: ('#complexTransport'),
      model: Transport.model.State,
      collection: Transport.model.State.get('connections')
    });

  });

})(jQuery);
