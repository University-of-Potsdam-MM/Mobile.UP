define(['jquery', 'underscore', 'backbone', 'utils', 'Session', 'uri/URI'], function($, _, Backbone, utils, Session, URI){

	var PulsAPI = {};

	PulsAPI.Model = Backbone.Model.extend({
        noAuth: false,

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
			options.data = this._selectRequestData(options.url, this.noAuth);
			return Backbone.Model.prototype.sync.call(this, method, model, options);
		},

		_selectRequestData: function(url, noAuth) {
			var session = new Session();
			var uri = new URI(url);

			var auth = noAuth ? {} : {
				"user-auth": {
					username: session.get("up.session.username"),
					password: session.get("up.session.password")
				}
			};

			return JSON.stringify(_.extend({
                condition: JSON.parse(uri.fragment()),
            }, auth));
		}
	});

	PulsAPI.Collection = Backbone.Collection.extend({
		noAuth: false,

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
			options.data = this._selectRequestData(options.url, this.noAuth);
			// method to catch no user rights exception
			var error= options.error;
			var success = options.success;
			options.success = function(resp){
				if (resp && resp.message){
					if (resp.message == "no user rights"){
						resp.msg = "Die Funktion wird für Sie nicht unterstützt.";
					}
        			error(resp);
				} else{
					success(resp);
				}
			};
			return Backbone.Model.prototype.sync.call(this, method, model, options);
		},

		_selectRequestData: function(url, noAuth) {
            var session = new Session();
            var uri = new URI(url);

            var auth = noAuth ? {} : {
                    "user-auth": {
                        username: session.get("up.session.username"),
                        password: session.get("up.session.password")
                    }
                };

            return JSON.stringify(_.extend({
                condition: JSON.parse(uri.fragment()),
            }, auth));
		}
	});

	var StudentDetails = PulsAPI.Collection.extend({

		url: "https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/getPersonalStudyAreas#{}",

		initialize: function() {
			this.session = new Session();
		},

		parse: function(data) {
			return this.asArray((data.personalStudyAreas || {}).Abschluss);
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
			var errorMessage = data.academicAchievements;

			var achievements = this.asObject(data.academicAchievements.achievement);
			achievements.field = _.map(this.asArray(achievements.field), this.parseModule, this);

			var studyAreas = _.map(this.asArray(data.academicAchievements.degree.studyArea), this.parseStudyAreas, this);

			return {
				achievements: this.mergeStudyAreas(achievements, studyAreas),
				errorMessage: errorMessage
			};
		},

		mergeStudyAreas: function(achievements, studyAreas) {
			var fieldCopy = achievements.field;
			achievements.field = _.map(studyAreas, function(area) {
				var field = _.find(fieldCopy, function(f) { return f.fieldName === area.fieldName; });
				return _.extend({}, field, area);
			});

			return achievements;
		},

		asObject: function (subject) {
			if (typeof subject === "object") {
				return subject;
			} else {
				return {};
			}
		},

		parseStudyAreas: function(area) {
			return {
				id: _.uniqueId("field"),
				fieldName: area.name,
				hint: area.hint
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

			module.examination.nonGraded = module.examination.nonGraded || [];
			module.examination.nonGraded = this.asArray(module.examination.nonGraded);

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