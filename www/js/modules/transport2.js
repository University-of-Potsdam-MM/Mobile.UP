define([ 'jquery', 'underscore', 'backbone', 'utils', 'moment'], 
  function($, _, Backbone, utils, moment){

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
      this.connections = this.trip.get('connections');
      this.template = utils.rendertmpl('transport2_listitem');

      this.listenTo(this.trip, 'sync', this.render);
      this.listenTo(this.trip, 'error', this.renderErrorMessage);
      this.listenTo(this.trip, 'sync error', this.spinnerOff);

      _.bindAll(this, 'addOne');

      this.upperLoadingView = new utils.LoadingView({el: this.$("#loadingSpinner")}); //TODO:bei später spinner unten!
      this.lowerLoadingView = new utils.LoadingView({el: this.$("#spaeterLoadingSpinner")});
    },

    addOne: function(connection) {
      this.$el.find('#transport_rides').append(this.template({connection: connection}));
    },

    searchEarlier: function(ev){
      this.currentLoadingView = this.upperLoadingView;
      this.currentLoadingView.spinnerOn();

      this.trip.buildURL({earlier: true});
      this.trip.fetch({earlier: true});
    },

    searchLater: function(ev){
      this.currentLoadingView = this.lowerLoadingView;
      this.currentLoadingView.spinnerOn();

      this.trip.buildURL({later: true});
      this.trip.fetch({later: true});
    },

    search: function(dateTime) {
      this.currentLoadingView = this.upperLoadingView;
      this.currentLoadingView.spinnerOn();

      this.$el.find('#transport_rides').empty();
      this.$el.find('.scrollbutton').hide();

      this.trip.set('date', dateTime.format('YYYY-MM-DD'));
      this.trip.set('time', dateTime.format('HH:mm'));

      this.trip.get('connections').reset(null);
      this.trip.buildURL({});
      this.trip.fetch({earlier: true, later: true});
    },

    spinnerOff: function() {
      this.currentLoadingView.spinnerOff();
    },

    render: function() {
      this.$el.find('#transport_rides').empty();
      this.$el.find('.scrollbutton').show();
      this.connections.each(this.addOne);
      this.$el.trigger("create");
      return this;
    },

    renderErrorMessage: function(){
      var errorPage = new utils.ErrorView({el: this.$el, msg: 'Die Transportsuche ist momentan nicht verfügbar', module: 'transport2'});
    }
  });

  
  /**
   * BackboneView - Transport2PageView
   * Main View for complex transport search
   */
  var Transport2PageView = Backbone.View.extend({
    attributes: {"id": "transport2"},

    events: {
      'click #searchButton': 'searchTrips'
    },

    initialize: function(){
      this.model = new CampusTrip();
      this.template = utils.rendertmpl('transport2');
    },
    
    getDateTime: function(){
      return moment(this.$el.find('#transportationDate').val()+ ' ' + this.$el.find('#transportationTime').val(), 'DD.MM.YYYY HH:mm');
    },

    searchTrips: function(){
      var dateTime = this.getDateTime();
      this.transportListView.search(dateTime);
    },

    render: function(){
      this.$el.html(this.template({}));

      fromStation = new NavigationView({el: this.$el.find("#fromStation2")});
      toStation = new NavigationView({el: this.$el.find("#toStation2")});

      fromStation.on('select', _.bind(function(buttonName){
        this.model.setOrigin(buttonName);
        toStation.activeButton(this.model.get('destCampus'));
      }, this));
      toStation.on('select', _.bind(function(buttonName){
        this.model.setDest(buttonName);
        fromStation.activeButton(this.model.get('originCampus'));
      }, this));

      this.$el.find('#result .scrollbutton').hide();
      this.transportListView = new TransportListView({
        el: this.$el.find('#result'),
        campusTrip: this.model
      });
      this.$el.trigger("create");
      return this;
    }
  });

  return Transport2PageView;

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
    model: Connection,
    comparator: 'depTime'
  })

  // VBB-Request
  var CampusTrip = Backbone.Model.extend({

    campus: {
      "G-see": "009230003",
      "Golm": "009220010",
      "Palais": "009230132"
    },

    defaults: {
      "originId": "009230003",
      "originCampus": "G-see",
      "destId": "009230132",
      "destCampus": "Palais"
    },

    url: endpoint()+'trip',

    initialize: function(){
      this.set('connections', new Connections());
      this.set('date', moment().format('YYYY-MM-DD'));
      this.set('time', moment().format('HH:MM'));
    },

    setOrigin: function(campus){
      if(this.get('destCampus') == campus){
        this.set('destId', this.get('originId'));
        this.set('destCampus', this.get('originCampus'));
      }
      this.set('originId', this.campus[campus]);
      this.set('originCampus', campus);
    },

    setDest: function(campus){
      if(this.get('originCampus') == campus){
        this.set('originId', this.get('destId'));
        this.set('originCampus', this.get('destCampus'));
      }
      this.set('destId', this.campus[campus]);
      this.set('destCampus', campus);
    },

    buildURL: function(options){
      this.url = endpoint()+'trip?format=json&accessId=41f30658-b439-4529-9922-beb13567932c&originId='+this.get('originId')+'&destId='+this.get('destId')+'&date='+this.get('date')+'&time='+this.get('time');
      if(options.earlier){
        this.url += '&context='+this.get('earlier');
      }
      if(options.later){
        this.url += '&context='+this.get('later');
      }
    },

    parse: function(data, options){
      _.each(data.Trip, _.bind(function(con){
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
        this.get('connections').add(new Connection({sections: sections}));
      }, this));
      if(options.earlier) this.set('earlier', data.scrB);
      if(options.later) this.set('later', data.scrF);
      this.trigger('change');
      return this;
    }
  });