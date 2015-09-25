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
    anchor: '#transport_rides',

    events: {
      "click #earlierButton": "searchEarlier",
      "click #laterButton"  : "searchLater"
    },

    initialize: function(options) {
      this.trip = options.campusTrip;
      this.connections = this.trip.get('connections');
      this.template = utils.rendertmpl('transport2_listitem');
      this.el = $(this.anchor);
      _.bindAll(this, 'addOne');
    },

    addOne: function(connection) {
      $(this.el).append(this.template({connection: connection}));
    },

    searchEarlier: function(ev){
      this.LoadingView = new utils.LoadingView({model: this.trip, el: this.$("#loadingSpinner")});
      this.trip.buildURL({earlier: true});
      this.trip.fetch({earlier: true});
    },

    searchLater: function(ev){
      this.LoadingView = new utils.LoadingView({model: this.trip, el: this.$("#spaeterLoadingSpinner")});
      this.trip.buildURL({later: true});
      this.trip.fetch({later: true});
    },

    render: function() {
      $(this.el).empty();
      this.connections.each(this.addOne);
      return this;
    }
  });

  
  /**
   * BackboneView - Transport2PageView
   * Main View for complex transport search
   */
  var Transport2PageView = Backbone.View.extend({
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
      this.listenTo(this.model, 'error', this.renderErrorMessage);
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

      this.model.get('connections').reset(null);
      this.model.buildURL({});
      this.model.fetch({earlier: true, later: true});
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

      fromStation.activeButton(this.model.get('originCampus'));
      toStation.activeButton(this.model.get('destCampus'));

      this.toggleListView();
      this.$el.trigger("create");
      return this;
    },

    renderErrorMessage: function(){
      var errorPage = new utils.ErrorView({el: '#result', msg: 'Die Transportsuche ist momentan nicht verfügbar', module: 'transport2'});
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