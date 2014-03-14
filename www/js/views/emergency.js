(function($){

	// Backbone code - start
	/*
	 * Models
	 */
	// model for emergency items
	var EmergencyCall = Backbone.Model.extend({
		defaults:{
			name: 'n',
			telephone: 'w',
			description: 'a',
		}
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
		//el: $('#emergencies'),
		tagName: 'ul',
		attributes: {"data-role": "listview", "data-inset":"true", "data-icon":"false"},

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
			// iterate over collection and call EmergencyCallViews render method	
			this.collection.each(function(emergencycall){
				var emergencyCall = new EmergencyCallView({model: emergencycall});
				//(this.$el).append(emergencyCall.render().el)
				$(this.el).append(emergencyCall.render().el);	
			}, this);
			console.log("wuff");
			$('#emergencies').trigger("create");
			return this;
		}
	});
	// Backbone code - end
	
	$(document).on("pageinit", "#emergency", function () {
		
		// create instance of our emergency collection
		var emergencyCalls = new EmergencyCalls();
		
		// pass collection to emergency view
		var emergencyCallsView = new EmergencyCallsView({collection: emergencyCalls});
		//console.log(emergencyCallsView.render().el);

		$('#emergencies').append(emergencyCallsView.render().el);
	
		
	});
})(jQuery);

