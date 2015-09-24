define([ 'jquery', 'underscore', 'backbone', 'utils', 'modules/transportREST.util', 'moment'], 
  function($, _, Backbone, utils, transport, moment){

  // var view_state_from = {campus: 'G-see'};
  // var view_state_to = {campus: 'Palais'};

  /**
   * Backbone View - NavigationView
   */
  var NavigationView = Backbone.View.extend({
    events: {
      'click a' : 'selectButton'
    },

    activeButton: function(buttonText){
      this.$el.find('a').removeClass('ui-btn-active');
      this.$el.find('a').filter(function(){
        return $(this).text() === buttonText;
      }).addClass('ui-btn-active');
    },

    selectButton: function(ev){
      ev.preventDefault();
      var buttonName = $(ev.target).html();
      this.trigger('select', buttonName);
    }
  });


  /**
   *  Backbone View - TransportListView
   */
  var TransportListView = Backbone.View.extend({

    anchor: '#transport_rides',

    events: {
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater"
    },

    initialize: function(options) {
      this.trip = options.campusTrip;
      this.connections = this.trip.get('connections');

      // Listen to changes in the new collection
      this.connections.on("reset", this.render, this);
      this.connections.on("add", this.addOne, this);

      this.template = utils.rendertmpl('transport2_listitem');

      this.el = $(this.anchor);
      _.bindAll(this, 'addOne');
    },

    addOne: function(connection) {
      $(this.el).append(this.template({connection: connection}));
    },

    searchTrips: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    searchEarlier: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    searchLater: function(ev){
      ev.preventDefault();
      this.trip.fetch();
    },

    render: function() {
      $(this.el).empty();
      this.connections.each(this.addOne);
      $(this.el).trigger('create');
      return this;
    }
  });

  
  /**
   * BackboneView - Transport2RESTPageView
   * Main View for complex transport search
   */
  var Transport2RESTPageView = Backbone.View.extend({
    attributes: {"id": "transport2"},

    events: {
      'click #transportationDate': 'setDate',
      'click #transportationTime': 'setTime',
      'click #searchButton': 'searchTrips'
    },

    initialize: function(){
      this.model = new CampusTrip();
      this.template = utils.rendertmpl('transport2');
      this.listenTo(this.model, 'sync', this.render);
    },
    
    setDate: function(){
      this.model.set('date', this.$el.find('#transportationDate').val());
      console.log(this.$el.find('#transportationDate').val());
    },

    setTime: function(){
      this.model.set('time', this.$el.find('#transportationTime').val());
    },

    searchTrips: function(){
      this.LoadingView = new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});

      this.model.buildURL();
      this.model.fetch();
    },

    renderTransportList: function(){
      transportViewTransportList = new TransportListView({
        el: this.$el.find('#result'),
        campusTrip: this.model
      });

      transportViewTransportList.render();
    },

    toggleListView: function(){
      if (this.model.get('connections').length == 0){
        this.$el.find('#result .scrollbutton').hide();
      }else{
        this.$el.find('#result .scrollbutton').show();
        this.renderTransportList();
      }
    },

    render: function(){
      this.$el.html(this.template({}));
      var that = this;

      fromStation = new NavigationView({el: this.$el.find("#fromStation2")});
      fromStation.on('select', function(buttonName){
        this.model.setOriginId(buttonName);
      });

      toStation = new NavigationView({el: this.$el.find("#toStation2")});
      toStation.on('select', function(buttonName){
        this.model.setDestId(buttonName);
      });

      this.$el.trigger("create");
      this.toggleListView();
      return this;
    }
  });

  return Transport2RESTPageView;

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function endpoint(){
      return 'https://esb.soft.cs.uni-potsdam.de:8243/services/transportTestAPI/';
  }

  var Section = Backbone.Model.extend({
  });

  var Sections = Backbone.Collection.extend({
    model: Section
  });

  var Connection = Backbone.Model.extend({
    initialize: function(options){
      this.set('depTime', options.sections.first().get('depTime'));
      this.set('depStation', options.sections.first().get('depStation'));
      this.set('arrTime', options.sections.last().get('arrTime'));
      this.set('arrStation', options.sections.last().get('arrStation'));
      this.set('sections', options.sections);
    }
  });

  // "Trip": [...]
  var Connections = Backbone.Collection.extend({
    model: Connection
  })

  // VBB-Request
  var CampusTrip = Backbone.Model.extend({
    defaults: {
      "originId": "009230003",
      "destId": "009230132"
    },

    url: endpoint()+'trip',

    initialize: function(){
      this.set('connections', new Connections());
      this.set('date', moment().format('YYYY-MM-DD'));
      this.set('time', moment().format('HH:MM'));
    },

    setOriginId: function(campus){
      if(campus == 'G-see') var id = "009230003";
      else if (campus == 'Golm') var id = "009220010";
      else var id = "009230132";
      this.set('originId', id);
    },

    setDestId: function(campus){
      if(campus == 'G-see') var id = "009230003";
      else if (campus == 'Golm') var id = "009220010";
      else var id = "009230132";
      this.set('destId', id);
    },

    buildURL: function(){
      this.url = endpoint()+'trip?format=json&accessId=41f30658-b439-4529-9922-beb13567932c&originId='+this.get('originId')+'&destId='+this.get('destId')+'&date='+this.get('date')+'&time='+this.get('time');
    },

    parse: function(data, options){
      var tripResponse = data;
      var that = this;
      _.each(tripResponse.Trip, function(con){
        var sections = new Sections();
        _.each(con.LegList.Leg, function(sec){
          var depTime = moment(sec.Origin.date + ' ' + sec.Origin.time);
          var arrTime = moment(sec.Destination.date + ' ' + sec.Destination.time);
          var section = new Section({'depTime': depTime,
                                    'depStation': sec.Origin.name,
                                    'depPlatform': sec.Origin.track,
                                    'arrTime': arrTime,
                                    'arrStation': sec.Destination.name,
                                    'arrPlatform': sec.Destination.track,
                                    'name': sec.name});
          sections.add(section);
        });
        var connection = new Connection({sections: sections});
        that.get('connections').add(connection);
      });
      this.trigger('change');
      return this;
    }
  });