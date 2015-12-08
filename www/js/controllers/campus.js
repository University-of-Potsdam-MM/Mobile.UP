define([
	"backboneMVC",
	"backbone",
	"controllers/baseController"
], function(BackboneMVC, Backbone, BaseController) {

	/*
	 * CampusController
	 */
	app.controllers.campus = BaseController.extend({
		name: 'campus',

		default:function(){
			this.index();
		}
	});
});