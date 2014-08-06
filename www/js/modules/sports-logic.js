define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils) {
	
	var SportsPageView = Backbone.View.extend({
		
		render: function() {
			if (window.cordova) {
				window.history.back();
				window.open("http://hochschulsport-potsdam.de", "_blank", "enableViewportScale=yes");
			} else {
				window.location.replace("http://hochschulsport-potsdam.de");
			}
		}
	});
	
	return SportsPageView;
});
