define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone) {
	
	var History = Backbone.Model.extend({
		
		history: [],
		
		startTracking: function() {
			// Because we track our own history, we have to consider the replace option
			// See http://backbonejs.org/#Router-navigate and {replace: true} for details
			var that = this;
			var savedNavigate = Backbone.history.navigate;
			Backbone.history.navigate = function(fragment, options) {
				// Pop current history entry if {replace: true}
				if (options.replace) {
					that.history.pop();
				}
				
				// Call original function
				savedNavigate.apply(this, arguments);
			};
		},
		
		goBack: function() {
			var lastPage = this.history[this.history.length-2].name;
			this.history.pop();
			Backbone.history.navigate(lastPage, {trigger:true});
		},
		
		push: function(route) {
			this.history.push({name: route});
		},
		
		hasHistory: function() {
			return this.history.length > 0;
		},
		
		currentRoute: function() {
			return this.history[this.history.length-1].name;
		},
		
		length: function() {
			return this.history.length;
		}
	});
	
	return new History;
});