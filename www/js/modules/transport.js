define(['jquery', 'underscore', 'backbone', 'utils', 'modules/transportREST.util'],
  function($, _, Backbone, utils, transport){

  /**
   *  Backbone View - NavigationView
   *  for navigating between transport and transport2 view
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
      console.log('prevent');
      ev.preventDefault();
      var buttonName = $(ev.target).html();
      this.trigger('select', buttonName);
    }
  });

  var view_state = {campus: 'G-see'};

  /**
   *  Backbone View - TransportListView
   */
  var TransportListView = Backbone.View.extend({

    events: {
      'click #later-button' : 'loadNext'
    },

    initialize: function(options) {
      this.stations = options.stations;
      this.updateContent(options.collection, options.stationName, options.stationTime);

      this.template = utils.rendertmpl('transport_listitem_view');

      this.$ul = this.$el.find('ul#transport-list');
      _.bindAll(this, 'addOne');
    },

    updateContent: function(stationDepartures, stationName, stationTime) {
      this.stationName = stationName;
      this.stationTime = stationTime;

      // Forget the old collection
      this.collection.off(null, null, this);
      this.collection = stationDepartures;

      // Listen to changes in the new collection
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.addOne, this);
    },

    addOne: function(departure) {
      this.$ul.append(this.template({departure: departure}));
    },

    loadNext: function(ev){
      ev.preventDefault();
      this.stations.fetch();
    },

    render: function() {
      this.$el.find('.stationName').html(this.stationName);
      this.$el.find('.stationTime').html(this.stationTime);
      this.$ul.empty();
      this.collection.each(this.addOne);
      return this;
    }
  });

  /**
   *  Transport Page View
   */
  var TransportPageView = Backbone.View.extend({
    attributes: {"id": "transport"},

    initialize: function(){
      this.collection = new transport.TransportStations();
      this.template = utils.rendertmpl('transport');
      this.listenTo(this, "prepareDepartures", this.prepareDepartures);
      this.listenTo(this, "renderTransportList", this.renderTransportList);
      this.listenTo(this.collection.where(view_state)[0], "sync", _.once(this.renderTransportList));
    },

    renderTransportList: function(){

      transportViewTransportList = new TransportListView({
        el: this.$el.find('#search-results'),
        stations: this.collection,
        collection: this.collection.where(view_state)[0].get('departures'),
        stationName: this.collection.where(view_state)[0].get('name'),
        stationTime: this.collection.where(view_state)[0].get('stationTime')
      });
      transportViewTransportList.render();
    },

    prepareDepartures: function(){
      this.LoadingView = new utils.LoadingView({collection: this.collection.where(view_state)[0], el: this.$("#loadingSpinner")});

      // check for existing departures otherwise fetch
      if (this.collection.where(view_state)[0].get('departures').length == 0){
        this.collection.fetch();
      }else{
        this.trigger("renderTransportList");
      }
    },

    render: function(){
      this.$el.html(this.template({}));

      transportViewNavbar = new NavigationView({
        el: this.$el.find("#from-station-navbar")
      });
      var that = this;
      transportViewNavbar.on('select', function(buttonName){
        view_state = {campus: buttonName};
        first_departure = that.collection.where(view_state)[0];
        transportViewTransportList.updateContent(first_departure.get('departures'), first_departure.get('name'), first_departure.get('stationTime'));
        transportViewTransportList.render();
      });

      this.$el.trigger("create");
      this.trigger("prepareDepartures");
      return this;
    }

  });

  return TransportPageView;

});