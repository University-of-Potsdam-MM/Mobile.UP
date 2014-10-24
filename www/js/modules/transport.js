define(['jquery', 'underscore', 'backbone', 'utils', 'modules/transport.util'], function($, _, Backbone, utils, ht){


  /**
   *  Backbone View - TransportViewsTransportList
   */
  var TransportViewsTransportList = Backbone.View.extend({

    events: {
      'vclick #later-button' : 'loadNext'
    },

    initialize: function(options) {
      this.stations = options.stations;
      this.stationName = options.stationName;
      this.stationTime = options.stationTime;

      this.template = utils.rendertmpl('transport_listitem_view');

      this.$ul = this.$el.find('ul#transport-list');
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.addOne, this);
      _.bindAll(this, 'addOne');
    },

    addOne: function(journey) {
      this.$ul.append(this.template({journey: journey}));
    },

    loadNext: function(){
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
   *  Backbone View - NavigationView
   *  for navigating between transport and transport2 view
   */
  var NavigationView = Backbone.View.extend({
    events: {
      'vclick a' : 'selectButton'
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
   *  Transport Page View
   */
  var TransportPageView = Backbone.View.extend({
    attributes: {"id": "transport"},

    initialize: function(){
      this.collection = ht.stations();
      this.template = utils.rendertmpl('transport');
      this.listenTo(this, "prepareJouneys", this.prepareJouneys);
      this.listenTo(this, "renderTransportList", this.renderTransportList);
      this.listenTo(this.collection.where({campus: 'G-see'})[0], "sync", this.renderTransportList);
      this.trigger("renderTransportList");
    },

    renderTransportList: function(){

      transportViewTransportList = new TransportViewsTransportList({
        el: this.$el.find('#search-results'),
        stations: this.collection,
        collection: this.collection.where({campus: 'G-see'})[0].get('journeys'),
        stationName: this.collection.where({campus: 'G-see'})[0].get('name'),
        stationTime: this.collection.where({campus: 'G-see'})[0].get('stationTime')
      });
      transportViewTransportList.render();
    },

    prepareJouneys: function(){
      this.LoadingView = new utils.LoadingView({collection: this.collection.where({campus: 'G-see'})[0], el: this.$("#loadingSpinner")});

      // check for existing journeys otherwise fetch
      if (this.collection.where({campus: 'G-see'})[0].get('journeys').length == 0){
        this.collection.fetch({success: function(){console.log('succ');}, error: function() { console.log(arguments); }});
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
        transportViewTransportList.collection = that.collection.where({campus: buttonName})[0].get('journeys');
        transportViewTransportList.stationName = that.collection.where({campus: buttonName})[0].get('name');
        transportViewTransportList.stationTime = that.collection.where({campus: buttonName})[0].get('stationTime');
        transportViewTransportList.render();
      });

      this.$el.trigger("create");
      this.trigger("prepareJouneys");
      return this;
    }

  });

  return TransportPageView;

});