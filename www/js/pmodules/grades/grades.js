define(['jquery', 'underscore', 'backbone', 'utils', 'Session'], function($, _, Backbone, utils, Session){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/grades");

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

	var GradesView = Backbone.View.extend({

		events: {
			"click .grades-tabs": "tabClick"
		},

		initialize: function() {
			this.template = rendertmpl("gradeList");
			this.moduleTemplate = rendertmpl("gradeList.module");
			this.listenTo(this.model, "sync", this.render);
		},

		tabClick: function(ev) {
			ev.preventDefault();
			return false;
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({
				data: this.model.toJSON(),
				moduleTemplate: this.moduleTemplate
			}));
			this.$el.trigger("create");
		}
	});

	var GradeAveragesView = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl("gradeAverages");
			this.listenTo(this.model, "sync", this.render);
		},

		render: function() {
			var averages = undefined;
			if (this.model.get("averageGrade") && this.model.get("lps")) {
				averages = {grade: this.model.get("averageGrade"), lps: this.model.get("lps")};
			}

			this.$el.empty();
			this.$el.append(this.template({averages: averages}));
			this.$el.trigger("create");
		}
	});

	app.views.GradesPage = Backbone.View.extend({

		attributes: {"id": "grades"},

		initialize: function(){
			this.template = rendertmpl('grades');
			this.listenToOnce(this, "render", this.prepareGrade);

			this.grades = new Grades();
			this.listenTo(this.grades, "error", this.requestFail);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#gradesHost', msg: 'Zurzeit nicht verfügbar.', module: 'grades', err: error});
		},

		prepareGrade: function() {
			new GradesView({model: this.grades, el: this.$("#gradesTable")});
			new GradeAveragesView({model: this.grades, el: this.$("#averageData")});
			new utils.LoadingView({model: this.grades, el: this.$("#loadingSpinner")});

			this.grades.fetch(utils.cacheDefaults());
		},

		render: function(){
			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			this.trigger("render");
			return this;
		}
	});

	return app.views.GradesPage;
});