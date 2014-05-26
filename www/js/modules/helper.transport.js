define(['jquery', 'underscore', 'backbone', 'helper', 'moment'], function($, _, Backbone, helper){

  // console.log('loading nahverkehr-logic.js');
  // console.log('dependencies:', moment, jQuery);

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
      //return 'http://api.uni-potsdam.de/endpoints/transportAPI/1.0/';
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


  function verbindungVonNach(fromExternalId, toExternalId, moment, arrivalMode) {

    var rflags;
    if ('1' == arrivalMode) {
      rflags = tag('RFlags', {b: 5, f: 0, a: 0 })
    } else {
      // default
      rflags = tag('RFlags', {b: 0, f: 5, a: 0 })
    }

    console.log('rflags', rflags);

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
          rflags
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

  var getVerbindung = function(fromExternalId, toExternalId, moment, arrivalMode) {
    var defer = $.Deferred();
    $.post(
      endpoint(),
      verbindungVonNach(fromExternalId, toExternalId, moment, arrivalMode),
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

  // getVerbindung(stations['G-see'].externalId, stations['Golm'].externalId, moment())
  //   .done(function(data){
  //     console.log('debugging', data);
  //   });

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
  });

  return {
  	stations: function() {return stations;},
    getVerbindung: getVerbindung
  };

});