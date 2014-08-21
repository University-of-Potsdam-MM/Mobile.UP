define(['jquery', 'underscore', 'backbone', 'utils', 'modules/transport.util'], function($, _, Backbone, utils, ht){

  /**
   *  Backbone View - TransportViewsTransportList
   */
  var TransportViewsTransportList = Backbone.View.extend({

    template: utils.rendertmpl('transport_listitem_view'),

    events: {
      'vclick #later-button' : 'loadNext'
    },

    initialize: function(options) {
      this.stationName = options.stationName;
      var transports = this.collection;
      this.$ul = this.$el.find('ul#transport-list');
      transports.on("reset", this.render, this);
      transports.on("add", this.addOne, this);
      _.bindAll(this, 'addOne');
    },

    addOne: function(journey) {
      this.$ul.append(this.template({journey: journey}));
    },

    loadNext: function(){
      this.LoadingView = new utils.LoadingView({collection: ht.stations(), el: this.$("#transport-result-wrapper")});
      ht.stations().fetch();
    },

    render: function() {
      console.log('render');
      this.$el.find('.stationName').html(this.stationName);
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
    template: utils.rendertmpl('transport'),

    initialize: function(){
      this.listenTo(this, "prepareJouneys", this.prepareJouneys);
    },

    prepareJouneys: function(){

      this.LoadingView = new utils.LoadingView({collection: ht.stations(), el: this.$("#loadingSpinner")});
//      this.LoadingView.spinnerOn();

      // check for existing journeys


      if (ht.stations().where({campus: 'G-see'})[0].get('journeys').length == 0){
        ht.stations().fetch();
      }

      // TODO: turn Spinner Off
      transportViewTransportList = new TransportViewsTransportList({
        el: this.$el.find('#search-results'),
        collection: ht.stations().where({campus: 'G-see'})[0].get('journeys'),
        stationName: ht.stations().where({campus: 'G-see'})[0].get('name'),
      });
      transportViewTransportList.render();
      //this.LoadingView.spinnerOff();
    },

    render: function(){
      this.$el.html(this.template({}));

      transportViewNavbar = new NavigationView({
        el: this.$el.find("#from-station-navbar")
      });

      transportViewNavbar.on('select', function(buttonName){
        transportViewTransportList.collection = ht.stations().where({campus: buttonName})[0].get('journeys');
        transportViewTransportList.stationName = ht.stations().where({campus: buttonName})[0].get('name')
        transportViewTransportList.render();
      });

      this.$el.trigger("create");
      this.trigger("prepareJouneys");
      return this;
    }

  });

  return TransportPageView;

});