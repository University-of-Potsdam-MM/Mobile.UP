define([
	'jquery',
	'underscore',
	'backbone',
	'uri/URI',
	'Session'
], function($, _, Backbone, URI, Session){
	
	var MoodleFile = Backbone.Model.extend({
		
		initialize: function(params) {
			this.url = params.url;
			this.boundOpenViaActivity = _.bind(this.openViaActivity, this);
			this.boundOpeningFailed = _.bind(this.openingFailed, this);
		},
		
		open: function() {
			this.fetch();
		},
		
		fetch: function() {
			var pdfViewer = "http://docs.google.com/viewer?url=" + encodeURIComponent(this.url);
			
			window.plugins.webintent.startActivity({
					action: window.plugins.webintent.ACTION_VIEW,
					url: pdfViewer
				},
				function() {},
				this.boundOpeningFailed);
			
//			$.ajax({
//				type: "HEAD",
//				url: this.url,
//				success: this.boundOpenViaActivity,
//				error: this.boundOpeningFailed
//			});
		},
		
		openViaActivity: function(data, textStatus, jqHXR) {
			var contentType = jqHXR.getResponseHeader("content-type");
			console.log("contentType: " + contentType);
			
			window.plugins.webintent.startActivity({
					action: window.plugins.webintent.ACTION_VIEW,
					url: this.url,
					type: contentType
				},
				function() {},
				this.boundOpeningFailed);
		},
		
		openingFailed: function() {
			alert("Konnte URL nicht öffnen");
			console.log("Failed to open URL via Android Intent. URL: " + this.url);
		}
	});
	
	var MoodleDownload = Backbone.Model.extend({
		
		openMoodleFileUrl: function(url) {
			var uri = new URI(url);
			if (!uri.hasQuery("token")) {
				uri.addQuery({ token: new Session().get("up.session.MoodleToken") });
			}
			
			var path = uri.path();
			if (!_.str.startsWith(path, "/webservice")) {
				uri.path("/webservice" + path);
			}
			
			new MoodleFile({url: uri.toString()}).open();
		}
	});
	
	MoodleDownload.isMoodleFileUrl = function(url) {
		return _.str.startsWith(url, "https://moodle2.uni-potsdam.de/pluginfile.php/") || _.str.startsWith(url, "https://moodle2.uni-potsdam.de/webservice/pluginfile.php/");
	};
	
	return MoodleDownload;
});