(function($){

	// Backbone code - start
	/*
	 * Models
	 */
	// model for emergency items
	var EmergencyCall = Backbone.Model.extend({
	});
	
	// collection for emergency items
	var EmergencyCalls = Backbone.Collection.extend({
		model: EmergencyCall,
		url: 'js/json/emergencycalls.json'
	});
	
	
	/*
	 * Views
	 */
	// view for single emergency call
	var EmergencyCallView = Backbone.View.extend({
		tagName: 'li',
		template: null,
		
		initialize: function(){
			_.bindAll(this, 'render');
			this.template = rendertmpl('emergencycall');
		},
		
		render: function(){
			$(this.el).html(this.template({emergency: this.model.toJSON()}));
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
			
			this.el.listview("refresh");
			return this;
		}
	});
	// Backbone code - end
	
	
	
	$(document).on("pageinit", "#emergency", function () {
		
		// create instance of our emergency collection
		var emergencyCalls = new EmergencyCalls();
		
		// pass collection to emergency view
		var emergencyCallsView = new EmergencyCallsView({collection: emergencyCalls});

		
	});
})(jQuery);
