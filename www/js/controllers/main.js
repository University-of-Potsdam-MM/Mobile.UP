define([
	"backboneMVC",
	"modules/home"
], function(BackboneMVC) {

	/*
	 * MainController
	 */
	app.controllers.main = BackboneMVC.Controller.extend({
		name: 'main',

		default: function () {
			this.index();
		}

	});
});