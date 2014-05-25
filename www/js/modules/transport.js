define(['jquery', 'underscore', 'backbone', 'helper', 'modules/helper.transport'], function($, _, Backbone, helper, ht){


  window.Transport = {
    model: {},
    collection: {},
    views: {},
    view: {},
  };

  var TransportViewsTransportList = Backbone.View.extend({
    initialize: function(options) {
      this.stationName = options.stationName;
      var transports = this.collection;
      console.log(this);
      this.$ul = this.$el.find('ul');
      transports.on("reset", this.render, this);
      transports.on("add", this.addOne, this);
      _.bindAll(this, 'addOne');
    },
    template: helper.rendertmpl('transport_listitem_view'),
    addOne: function(journey) {
      console.log('add', journey);
      this.$ul.append(this.template({journey: journey}));
    },
    render: function() {
      console.log('render');
      console.log(this);
      this.$el.find('.stationName').html(this.stationName);
      this.$ul.empty();
      this.collection.each(this.addOne);
      return this;
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

  Transport.views.SliderView = Backbone.View.extend({
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
  var TransportPageView = Backbone.View.extend({
    attributes: {"id": "transport"},

    initialize: function(){
      this.template = helper.rendertmpl('transport');
    },

    render: function(){
      $(this.el).html(this.template({}));
      transportViewTransportList = new TransportViewsTransportList({
        el: ($('#search-results'), this.el),
        events: {
          'vclick #later-button' : function(){
            // we just fetch departing journeys for all stations
            _.each(stations, function(station){
              station.fetchJourneys();
            });
          }
        },
        collection: ht.stations()['G-see'].journeys,
        stationName: ht.stations()['G-see'].name,
      });
      transportViewTransportList.render();

      transportViewNavbar = new NavigationView({
        el: $("#from-station-navbar")
      });

      transportViewNavbar.on('select', function(buttonName){
        console.log(arguments);
        transportViewTransportList.collection = stations[buttonName].journeys;
        transportViewTransportList.stationName = stations[buttonName].name;
        transportViewTransportList.render();
      });

      $(this.el).trigger("create");
      return this;
    }

  });

  return TransportPageView;

});