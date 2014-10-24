define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
	/*
	 * Models
	*/
	// model for emergency items
	var EmergencyCall = Backbone.Model.extend({
	});

	// collection for emergency items
	var EmergencyCalls = Backbone.Collection.extend({
		model: EmergencyCall,
		url: 'js/json/emergencycalls.json',
		comparator: 'name'
	});

	/*
	 * Views
	 */
	// view for single emergency call
	var EmergencyCallView = Backbone.View.extend({
		tagName: 'div',
		attributes: {"data-role": 'collapsible'},

		initialize: function(){
			_.bindAll(this, 'render');
			this.template = utils.rendertmpl('emergencycall');
		},

		render: function(){
			this.$el.html(this.template({emergency: this.model.toJSON()}));
			return this;
		}
	});

	// view for several emergency calls
	var EmergencyCallsView = Backbone.View.extend({
		anchor: '#emergency-list',

		initialize: function(){
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.collection.fetch({
				success: this.fetchSuccess,
				error: this.fetchError
			});
		},

		fetchSuccess: function() {
			this.render();
		},

		fetchError: function() {
			throw new Error('Error loading JSON file');
		},

		render: function(){
			this.el = $(this.anchor);
			// iterate over collection and call EmergencyCallViews render method
			this.collection.each(function(emergencycall){
				var emergencyCall = new EmergencyCallView({model: emergencycall});
				$(this.el).append(emergencyCall.render().el);
			}, this);

			this.el.trigger("create");
			return this;
		}
	});

	// view for the emergency page
	var EmergencyPageView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl('emergency');
		},

		render: function() {
			this.$el.html(this.template({}));
			var emergencyCalls = new EmergencyCalls();
			var emergencyCallsView = new EmergencyCallsView({collection: emergencyCalls});
			this.$el.trigger("create");
			return this;
		}
	});

	return EmergencyPageView;
});