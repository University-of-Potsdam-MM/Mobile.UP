define(['jquery', 'underscore', 'backbone', 'utils', 'moment'], function($, _, Backbone, utils, moment){

	var dateutils = {
            // I give this function a German name,
            // because someone introduced German weekday names as keys in opening.json
            tage: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],

            wochentag: function(date) {
              return (date) ? this.tage[date.getDay()] : '';
            },

            hoursColonMinutes: function(date){
              return (date) ? date.getHours() + ':' + date.getMinutes() : '';
            },

            openingForWochentag: function(timesArr, wochentag) {
              if (! _.isArray(timesArr)){ return;}
              var day = _.find(timesArr, function(timesForDay){
                //console.log('find day', wochentag, timesArr, timesForDay);
                return timesForDay.day == wochentag;
              });

              return (day) ? day.opening : false;
            },

            statusAtPlaceAndDate: function(place, date) {
              if (date && place) {
                var _wochentag = this.wochentag(date);
                var opening = this.openingForWochentag(place.times, _wochentag);

                if (opening === false) {
                  return 'closed';
                };

                if ((opening == null) || _.isString(opening)) {
                  return 'closed';
                };

                var time = this.hoursColonMinutes(date);
                if (_.isArray(opening)) {
                  var open = _.some(opening, function(fromTo){
                    return ((moment(fromTo[0], "hh:mm") < moment(time, "hh:mm")) && (moment(fromTo[1], "hh:mm") > moment(time, "hh:mm")))
                  });
                  return (open) ? 'open' : 'closed';
                }
                return 'problem'
            }
		}
	};

	var Opening = Backbone.Model.extend({
	});

	var Openings = Backbone.Collection.extend({
		model: Opening,
		url: 'js/json/opening.json',
    comparator: 'name'
	});

	var OpeningView = Backbone.View.extend({
		tagName: 'div',
		attributes: {"data-role": 'collapsible'},

		initialize: function(){
			_.bindAll(this, 'render');
			this.template = utils.rendertmpl('opening_detail');
		},

		render: function(){
			this.$el.html(this.template({opening: this.model.toJSON()}));
			return this;
		}
	});

	var OpeningsView = Backbone.View.extend({
		anchor: '#opening-list',

		initialize: function(){
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.collection.fetch({
				success: this.fetchSuccess,
				error: this.fetchError
			});
		},

		fetchSuccess: function() {
      this.collection = this.addTextToTimes(this.collection);
      var now = new Date();

      _.each(this.collection.models, function(model){
        model.attributes.statusOpenNow = dateutils.statusAtPlaceAndDate(model.attributes, now);
      });

			this.render();
		},

		addTextToTimes: function (collection) {
			var parentThis = this;
            _.each(collection.models, function(model) {
              // console.log('place',place);
              _.each(model.get('times'), function(day){
                // console.log('day', day);
                if(_.isString(day.opening)) {
                  day.opening_text = day.opening;
                  return;
                }

                if(_.isArray(day.opening)){
                  var text = _.map(day.opening, function(fromToArr){
                    // console.log('fromToArr', fromToArr);
                    if (_.isArray(fromToArr)) {
                      return parentThis.fromToDaytimeString(fromToArr[0], fromToArr[1]);
                    } else {
                      return fromToArr;
                    }
                  }).join(' | ');
                  day.opening_text = text;
                  // console.log('text', text);
                  return;
                }

              })
            });
            return collection;
        },

    fromToDaytimeString: function(from, to) {
			var string = '' + from + ' - ' + to + ' Uhr';
      // console.log('string',string);
      return string;
    },

		fetchError: function() {
			throw new Error('Error loading Opening-JSON file');
		},

		render: function() {
			this.el = $(this.anchor);
			// iterate over collection and call EmergencyCallViews render method
			this.collection.each(function(opening){
				var openingView = new OpeningView({model: opening});
				$(this.el).append(openingView.render().el);
			}, this);
			this.el.trigger("create");
			return this;
		}

	});

	/**
	 *	BackboneView - Opening Page View
	 */
	var OpeningPageView = Backbone.View.extend({
    attributes: {"id": "opening"},

		initialize: function(){
			this.template = utils.rendertmpl('opening');
		},

    	render: function(){
    		this.$el.html(this.template({}));
    		var openings = new Openings();
    		var openingsView = new OpeningsView({collection: openings});
    		this.$el.trigger("create");
    		return this;
		}

  });

  return OpeningPageView;
});