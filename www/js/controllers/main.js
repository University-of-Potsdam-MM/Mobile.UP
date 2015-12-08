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
		},
		/**
		 * Zeigt das Hauptmenü an
		 */
		menu: function () {
			var self = this;
			app.loadPage(this.name, 'menu', {}, '-slide'); //Zeigt das Hauptmenü an
		}

	});
});