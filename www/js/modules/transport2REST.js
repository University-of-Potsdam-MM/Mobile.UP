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

    events: {
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater"
    },

    initialize: function(options) {
      this.trip = options.campusTrip;
      // Forget the old collection
      this.collection.off(null, null, this);
      this.collection = options.campusTrip.connections;

      // Listen to changes in the new collection
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.addOne, this);

      this.template = utils.rendertmpl('transport2_listitem');

      this.$ul = this.$el.find('transport_rides');
      _.bindAll(this, 'addOne');
    },

    addOne: function(connection) {
      this.$ul.append(this.template({connection: connection}));
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
      this.$ul.empty();
      this.collection.each(this.addOne);
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
      this.listenTo(this, "renderTransportList", this.renderTransportList);
    },
    
    setDate: function(){
      this.model.set('date', this.$el.find('#transportationDate').val());
    },

    setTime: function(){
      this.model.set('time', this.$el.find('#transportationTime').val());
    },

    searchTrips: function(){
      this.LoadingView = new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});

      // check for existing trips otherwise fetch
      if (this.model.get('connections').length == 0){
        this.model.setURL();
        this.model.fetch();
      }else{
        this.trigger("renderTransportList");
      }
    },

    renderTransportList: function(){
      transportViewTransportList = new TransportListView({
        el: this.$el.find('#result'),
        campusTrip: this.model
      });

      transportViewTransportList.render();
    },

    toggleScrollButtons: function(){
      if (this.model.get('connections').length == 0){
        this.$el.find('#result .scrollbutton').hide();
      }else{
        this.$el.find('#result .scrollbutton').show();
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

      this.toggleScrollButtons();

      this.$el.trigger("create");
      return this;
    }
  });

  return Transport2RESTPageView;

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function endpoint(){
      return 'https://esb.soft.cs.uni-potsdam.de:8243/services/transportTestAPI/';
  }

  var Connection = Backbone.Model.extend({
  });

  // "Trip": [...]
  var Connections = Backbone.Collection.extend({
    model: Connection
  })

  // VBB-Request
  var CampusTrip = Backbone.Model.extend({
    defaults: {
      "originId": "009230003",
      "destId": "009230132"//,
      // "date": "",
      // "time": "",
      // "connections": ""
    },

    url: endpoint()+'trip',

    initialize: function(){
      this.set({//"originId": this.getOriginId(),
                //"destId": this.getDestId(),
                "date": moment().format('YYYY-MM-DD'),
                "time": moment().format('HH:MM'),
                "connections": new Connections});
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

    setURL: function(){
      this.url = endpoint()+'trip?format=json&accessId=41f30658-b439-4529-9922-beb13567932c&originId='+this.get('originId')+'&destId='+this.get('destId')+'&date'+this.get('date')+'&time='+this.get('time');
    },

    parse: function(data, options){
      console.log(data.Trip);
      this.get('connections').add(data.Trip);
      console.log(this.get("connections"));
      return this;
    }

    // fetch: function(){
    //   this.trigger("request");
    //   var that = this;

    // };
  });