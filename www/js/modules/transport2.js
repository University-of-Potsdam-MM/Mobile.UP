define(['jquery', 'underscore', 'backbone', 'helper', 'modules/helper.transport', 'moment'], function($, _, Backbone, helper, ht){
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


  Transport.views.ComplexSearchView = Backbone.View.extend({
    initialize: function(){
    	console.log('init');
      var query = this.model;
      var resultList = this.collection;
      resultList.on('reset', this.renderResults, this);
      resultList.on('add', this.render, this);
    },
    events:{
      "vclick #searchButton" : "searchButton",
      "vclick #earlierButton": "searchEarlier",
      "vclick #laterButton"  : "searchLater",
    },
    searchButton: function() {
      console.log('click searchButton');
      this.model.set('depTime', this.getMoment());
      this.search();
    },
    search: function(){
      console.log('fetch & render');
      this.model.fetchConnections();
      this.renderSummary();
    },
    searchEarlier: function(){
      console.log('click earlierButton');
      this.model.addTime('minutes', -30);
      this.search();
    },
    searchLater: function(){
      console.log('click laterButton');
      this.model.addTime('minutes', 30);
      this.search();
    },

    // returns a momentjs object for Transportation Date + Time
    getMoment: function() {
      var date = this.getDate();
      var time = this.getTime();
      if ('Heute' === date) {
        if ('Jetzt' === time) {
          // Heute & Jetzt
          return moment();
        } else {
          // Heute + specific time
          // time should be parseable in the format
          // '09:59 AM'
          return moment(time, 'H:mm A');
        }
      } else {
        // date should be parseable
        var mDate = moment(date);
        var mTime;
        if ('Jetzt' === time) {
          // current time but on a specific date
          mTime = moment();
        } else {
          // parse time
          mTime = moment(time, 'H:mm A')
        }

        // setting minutes and hours on the mDate object
        mDate.hours(mTime.hours());
        mDate.minutes(mTime.minutes());
        return mDate;
      }
    },
    getDate: function(){
      // we shouldn't store data in the DOM,
      // but I don't know how to access this in another way
      var val = this.$el.find('#transportationDate').val();
      return val;
    },
    getTime: function(){
      // we shouldn't store data in the DOM,
      // but I don't know how to access this in another way
      var val = this.$el.find('#transportationTime').val()
      return val;
    },

    render: function(){
      console.log('render', this.collection);
      this.renderScrollButtons();

      // TODO render resultlist
      return this;
    },
    renderScrollButtons: function(){
      if (this.collection.isEmpty()){
        this.$el.find('#result .scrollbutton').hide();
      } else {
        this.$el.find('#result .scrollbutton').show();
      }
    },
    renderSummary: function(){
      var q = this.model;
      this.$el.find('#summary .fromCampus').html(q.fromStation().name);
      this.$el.find('#summary .toCampus').html(q.toStation().name);
      this.$el.find('#summary .arrivalMode').html( ('0' === q.get('arrivalMode')) ? 'Abfahrt' : 'Ankunft');
      this.$el.find('#summary .when').html(q.get('depTime').format('DD.MM.YY HH:mm'));
    },

    templateListItem: helper.rendertmpl('complex_transport_listitem'),
    renderResults: function(){
      console.log('render results', this.collection);

      this.renderScrollButtons();

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

    addTime: function(units, value) {
      this.get('depTime').add(units, value);
    },

    setFromStation: function(string) {
      if (this.get('to') == string) {
        // if to and from are equal, both should switch
        this.set('to', this.get('from'));
      }
      this.set('from', string);
    },
    setToStation: function(string) {
      if (this.get('from') == string) {
        // if to and from are equal, both should switch
        this.set('from', this.get('to'));
      }
      this.set('to', string);
    },

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
      console.log('DateTime for connection:', this.get('depTime').format('DD.MM.YYYY - HH:mm') );

      var that = this;
      ht.getVerbindung(
        this.fromStation().externalId,
        this.toStation().externalId,
        this.get('depTime'),
        this.get('arrivalMode')
      ).done(function(connections){
        that.resetConnections(connections);
      });
    },
    toggleArrivalMode: function(){
      var mode = this.get('arrivalMode') || '0';
      var toggled = (mode == '0') ? '1' : '0';
      this.set( 'arrivalMode', toggled );

      //FIXME should also move depTime to arrTime and back
    }
  });

	var NavigationView = Backbone.View.extend({
    events: {
      "vclick a" : function(ev){
        ev.preventDefault();
        var buttonName = $(ev.target).html();
        this.trigger('select', buttonName);
      }
    },
    activeButton: function(buttonText){
      this.$el.find('a').removeClass('ui-btn-active');
      this.$el.find('a').filter(function(){
        return $(this).text() === buttonText;
      }).addClass('ui-btn-active');
    }
  });

	var TransportViewsSliderView = Backbone.View.extend({
    events: {
      'slidestart': function(ev){
        console.log('toggleMode', ev);
        this.trigger('toggle');
      }
    }
  });

  /*
   *  Transport Page View
   */
  var Transport2PageView = Backbone.View.extend({
    attributes: {"id": "transport2"},

    initialize: function(){
      this.template = helper.rendertmpl('transport2');
    },

    render: function(){
      $(this.el).html(this.template({}));

	    console.log('pageinit #transport2');

	    Transport.model.State = new Transport.StateModel({
	      from: "G-see",
	      to: "Palais",
	      arrivalMode: '0',
	    });

	    // From station

	    Transport.view.FromStation = new NavigationView({
	      el: $("#fromStation2")
	    });

	    Transport.view.FromStation.on('select', function(buttonName){
	      Transport.model.State.setFromStation(buttonName);
	    });

	    Transport.model.State.on('change:from', function(ev, buttonText){
	      Transport.view.FromStation.activeButton(buttonText);
	    });

	    // To station

	    Transport.view.ToStation = new NavigationView({
	      el: $("#toStation2"),
	    });

	    Transport.view.ToStation.on('select', function(buttonName){
	      Transport.model.State.setToStation(buttonName);
	    });

	    Transport.model.State.on('change:to', function(ev, buttonText){
	      Transport.view.ToStation.activeButton(buttonText);
	    });

	    // Slider

	    Transport.view.ArrivalModeSlider = new TransportViewsSliderView({
	      el: $('#flip-1')
	    });

	    Transport.view.ArrivalModeSlider.on('toggle', function(){
	      Transport.model.State.toggleArrivalMode();
	      console.log('arrivalMode', Transport.model.State.get('arrivalMode'));
	    });

	    Transport.view.ComplexSearch = new Transport.views.ComplexSearchView({
	      el: ('#complexTransport'),
	      model: Transport.model.State,
	      collection: Transport.model.State.get('connections')
	    });
	    Transport.view.ComplexSearch.render();

      $(this.el).trigger("create");
      return this;
    }

  });

  return Transport2PageView;

});