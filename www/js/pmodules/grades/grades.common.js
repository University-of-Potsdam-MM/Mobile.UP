define(['jquery', 'underscore', 'backbone', 'utils', 'Session', 'uri/URI'], function($, _, Backbone, utils, Session, URI){

	var PulsAPI = {};

	PulsAPI.Model = Backbone.Model.extend({

		asArray: function(subject) {
			if (Array.isArray(subject)) {
				return subject;
			} else if (subject) {
				return [subject];
			} else {
				return [];
			}
		},

		sync: function(method, model, options) {
			options.url = _.result(model, 'url');
			options.contentType = "application/json";
			options.method = "POST";
			options.data = this._selectRequestData(options.url);
			return Backbone.Model.prototype.sync.call(this, method, model, options);
		},

		_selectRequestData: function(url) {
			var session = new Session();
			var uri = new URI(url);

			return JSON.stringify({
				condition: JSON.parse(uri.fragment()),
				"user-auth": {
					username: session.get("up.session.username"),
					password: "ddd" //session.get("up.session.password")
				}
			});
		}
	});

	PulsAPI.Collection = Backbone.Collection.extend({

		asArray: function(subject) {
			if (Array.isArray(subject)) {
				return subject;
			} else if (subject) {
				return [subject];
			} else {
				return [];
			}
		},

		sync: function(method, model, options) {
			options.url = _.result(model, 'url');
			options.contentType = "application/json";
			options.method = "POST";
			options.data = this._selectRequestData(options.url);
			return Backbone.Model.prototype.sync.call(this, method, model, options);
		},

		_selectRequestData: function(url) {
			var session = new Session();
			var uri = new URI(url);

			return JSON.stringify({
				condition: JSON.parse(uri.fragment()),
				"user-auth": {
					username: session.get("up.session.username"),
					password: "ddd" //session.get("up.session.password")
				}
			});
		}
	});

	var StudentDetails = PulsAPI.Collection.extend({

		url: "https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/getPersonalStudyAreas#{}",

		initialize: function() {
			this.session = new Session();
		},

		parse: function(data) {
			return this.asArray(data.personalStudyAreas.Abschluss);
		}
	});

	var Grades = PulsAPI.Model.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();
		},

		/**
		 * Requires student details {"Semester": ?, "MtkNr": ?, "StgNr": ?}
		 * @returns {string|*}
		 */
		url: function () {
			return new URI("https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/getAcademicAchievements")
				.fragment(JSON.stringify(this.studentDetails))
				.toString();
		},

		parse: function(data) {
			var achievements = this.asObject(data.academicAchievements.achievement);
			achievements.field = _.map(this.asArray(achievements.field), this.parseModule, this);

			return {
				achievements: achievements
			};
		},

		asObject: function (subject) {
			if (typeof subject === "object") {
				return subject;
			} else {
				return {};
			}
		},

		parseModule: function(module) {
			module.id = _.uniqueId("field");

			if (module.module)
				module.module = this.asArray(module.module);
			module.module = _.map(module.module, this.parseModule, this);

			module.examination = module.examination || {};
			module.examination.graded = module.examination.graded || [];
			module.examination.graded = this.asArray(module.examination.graded);

			if (module.credits && module.credits.accountCredits)
				module.credits.accountCredits = this.asArray(module.credits.accountCredits);
			else
				module.credits = {accountCredits: []};

			return module;
		}
	});

	return {
		StudentDetails: StudentDetails,
		Grades: Grades
	};
});