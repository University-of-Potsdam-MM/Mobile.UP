define(['jquery', 'underscore', 'backbone', 'utils', 'Session'], function($, _, Backbone, utils, Session){

	var Grades = Backbone.Model.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();
			this.url = "https://api.uni-potsdam.de/endpoints/pulsAPI/1.0?action=acm&auth=H2LHXK5N9RDBXMB&datatype=json2";
			this.url += "&user=" + encodeURIComponent(this.session.get('up.session.username'));
			this.url += "&password=" + encodeURIComponent(this.session.get('up.session.password'));

			this.url = "grades-spike/data.json";
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
		}
	});

	return {
		Grades: Grades
	};
});