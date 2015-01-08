define([
	'jquery',
	'underscore',
	'backbone',
	'uri/URI',
	'Session'
], function($, _, Backbone, URI, Session){
	
	/**
	 * Steps to open file:
	 * 1. Get content type
	 * 2. Download file content
	 * 3. Open file
	 */
	var MoodleFile = Backbone.Model.extend({
		
		initialize: function(params) {
			this.url = encodeURI(params.url);
			this.targetUrl = cordova.file.externalDataDirectory + Math.floor(Math.random() * 5) + ".tmp";
			
			this.listenTo(this, "syncContentType", this.downloadFileContent);
			this.listenTo(this, "error", this.onError);
		},
		
		fetch: function() {
			this.loadContentType();
		},
		
		loadContentType: function() {
			var that = this;
			$.ajax({
				type: "HEAD",
				url: this.url,
				success: function(data, textStatus, jqHXR) {
					var contentType = jqHXR.getResponseHeader("content-type");
					that.contentType = contentType;
					that.trigger("syncContentType", contentType);
				},
				error: function() {
					that.trigger("error");
				}
			});
		},
		
		downloadFileContent: function() {
			var that = this;
			var fileTransfer = new FileTransfer().download(
				this.url,
				this.targetUrl,
				function() {
					that.trigger("sync", that);
				},
			    function() {
					that.trigger("error", that);
				});
		},
		
		onError: function(error) {
			alert("Konnte Datei nicht öffnen");
			console.log("Failed to open URL: " + this.url);
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
			
			var file = new MoodleFile({url: uri.toString()});
			this.listenTo(file, "sync", this.openFile);
			file.fetch();
		},
		
		openFile: function(model) {
			console.log("download complete: " + model.targetUrl);
			
			window.plugins.webintent.startActivity({
					action: window.plugins.webintent.ACTION_VIEW,
					url: model.targetUrl,
					type: model.contentType
				},
				function() { },
				function() { alert("Konnte Datei nicht öffnen"); });
		},
	});
	
	MoodleDownload.isMoodleFileUrl = function(url) {
		return _.str.startsWith(url, "https://moodle2.uni-potsdam.de/pluginfile.php/") || _.str.startsWith(url, "https://moodle2.uni-potsdam.de/webservice/pluginfile.php/");
	};
	
	return MoodleDownload;
});