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
				that.push(fragment);

				// Call original function
				savedNavigate.apply(this, arguments);
			};

			Backbone.history.start({pushState: false, root: baseUrl});
		},

		/**
		 * Called by back button handler and by click on a[data-rel="back"]. Uses this.executeBack() internally
		 */
		goBack: function() {
			this.executeBack(function(lastPage) {
				Backbone.history.navigate(lastPage, {trigger:true, replace:true});
			});
		},

		/**
		 * Called by app.previous()
		 * @param callback
		 */
		executeBack: function(callback) {
			if(this.history[this.history.length - 2]) {
				this.history.pop();
				callback(this.history[this.history.length - 1].name);
			}
		},
		
		push: function(route) {
			this.history.push({name: route});
		},

		currentRouteInTransition: function() {
			if (this.history.length > 1) {
				return this.history[this.history.length - 2].name;
			} else if (this.history.length > 0) {
				return this.history[this.history.length - 1].name;
			} else {
				return undefined;
			}
		},

		/**
		 * Called by back button handler
		 * @returns {Number}
		 */
		length: function() {
			return this.history.length;
		}
	});
	
	return new History;
});