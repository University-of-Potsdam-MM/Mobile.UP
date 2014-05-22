define([
	'jquery',
	'underscore',
	'backbone',
	'router',
	'jquerymobile'], function($, _, Backbone, Router){

		var initialize= function(){
			Router.initialize();
		};

		return {
			initialize: initialize
		};
});