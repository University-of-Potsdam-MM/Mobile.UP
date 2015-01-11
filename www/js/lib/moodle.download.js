define([
	'jquery',
	'underscore',
	'backbone',
	'uri/URI',
	'Session',
	'headerParser'
], function($, _, Backbone, URI, Session, headerParser){
	
	/**
	 * Steps to open file:
	 * 1. Get content type and filename
	 * 2. Download file content
	 * 3. Open file
	 */
	var MoodleFile = Backbone.Model.extend({
		
		initialize: function(params) {
			this.url = encodeURI(params.url);
			
			this.listenTo(this, "syncContentMeta", this.downloadFileContent);
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
					that.fileName = headerParser(jqHXR.getResponseHeader("content-disposition")).filename;
					that.contentType = jqHXR.getResponseHeader("content-type");
					that.trigger("syncContentMeta", that);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					var error = {code: textStatus, http_status: errorThrown};
					that.trigger("error", that, error);
				}
			});
		},
		
		downloadFileContent: function() {
			var that = this;
			this.targetUrl = cordova.file.externalDataDirectory + this.fileName;
			var fileTransfer = new FileTransfer().download(
				this.url,
				this.targetUrl,
				function() {
					that.trigger("sync", that);
				},
			    function(error) {
					that.trigger("error", that, error);
				});
		},
		
		onError: function(model, error) {
			logMessage = _.template("Failed to download <%= error.source %> to <%= error.target %>. Error code is <%= error.code %>, http status code is <%= error.http_status %>");
			console.log(logMessage({error: error}));
			alert("Konnte Datei nicht herunterladen");
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