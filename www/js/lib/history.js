define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone) {
	
	var History = Backbone.Model.extend({
		
		history: [],
		
		startTracking: function(baseUrl) {
			// Because we track our own history, we have to consider the replace option
			// See http://backbonejs.org/#Router-navigate and {replace: true} for details
			var that = this;
			var savedNavigate = Backbone.history.navigate;
			Backbone.history.navigate = function(fragment, options) {
				// Pop current history entry if {replace: true}
				if (options && options.replace) {
					that.history.pop();
				}
				
				// Call original function
				savedNavigate.apply(this, arguments);
			};

			Backbone.history.start({pushState: false, root: baseUrl});
		},
		
		goBack: function() {
			var lastPage = this.history[this.history.length-2].name;
			this.history.pop();
			Backbone.history.navigate(lastPage, {trigger:true});
		},

		executeBack: function(callback) {
			if(this.history[this.history.length - 2]) {
				this.history.pop();
				callback(this.history[this.history.length - 1].name);
			}
		},

		executeWindowBack: function() {
			window.history.back();
		},
		
		push: function(route) {
			this.history.push({name: route});
		},
		
		hasHistory: function() {
			return this.history.length > 0;
		},
		
		currentRoute: function() {
			if (this.hasHistory()) {
				return this.history[this.history.length-1].name;
			} else {
				return undefined;
			}
		},
		
		length: function() {
			return this.history.length;
		}
	});
	
	return new History;
});