define(['jquery', 'underscore', 'backbone', 'utils', 'Session', 'uri/URI'], function($, _, Backbone, utils, Session, URI){

	var Grades = Backbone.Model.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();

			this.url = new URI("https://esb.soft.cs.uni-potsdam.de:8243/services/pulsTest/getAcademicAchievements")
				.fragment(JSON.stringify({"Semester": "20161", "MtkNr": "751352", "StgNr": "1"}))
				.toString();
		},

		parse: function(data) {
			var achievements = data.academicAchievements.achievement;
			achievements.field = _.map(achievements.field, this.parseModule, this);

			return {
				achievements: achievements
			};
		},

		parseModule: function(module) {
			module.id = _.uniqueId("field");

			if (module.module)
				module.module = this.asArray(module.module);
			module.module = _.map(module.module, this.parseModule, this);

			module.examination = module.examination || {};
			module.examination.graded = module.examination.graded || [];
			module.examination.graded = this.asArray(module.examination.graded);

			return module;
		},

		asArray: function(subject) {
			if (Array.isArray(subject)) {
				return subject;
			} else {
				return [subject];
			}
		},

		sync: function(method, model, options) {
			options.url = _.result(model, 'url');
			options.contentType = "application/json";
			options.method = "POST";
			options.data = this._selectRequestData(options.url, this.session);
			return Backbone.Model.prototype.sync.call(this, method, model, options);
		},

		_selectRequestData: function(url, session) {
			var uri = new URI(url);
			var data = {
				condition: JSON.parse(uri.fragment()),
				"user-auth": {
					username: session.get("up.session.username"),
					password: "ddd" //session.get("up.session.password")
				}
			};

			return JSON.stringify(data);
		}
	});

	return {
		Grades: Grades
	};
});