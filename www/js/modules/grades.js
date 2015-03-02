define(['jquery', 'underscore', 'backbone', 'utils', 'Session'], function($, _, Backbone, utils, Session){

	var Grades = Backbone.Model.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();
			this.url = "https://api.uni-potsdam.de/endpoints/pulsAPI?action=acm&auth=H2LHXK5N9RDBXMB&datatype=json2";
			this.url += "&user=" + encodeURIComponent(this.session.get('up.session.username'));
			this.url += "&password=" + encodeURIComponent(this.session.get('up.session.password'));
		},

		parse: function(result) {
			return result.jsonObject;
		}
	});

	var GradesView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl("gradeList");
			this.listenTo(this.model, "sync", this.render);
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({grades: this.model.get("grades")}));
			this.$el.trigger("create");
		}
	});

	var GradeAveragesView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl("gradeAverages");
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

	var GradesPageView = Backbone.View.extend({

		attributes: {"id": "grades"},

		initialize: function(){
			this.template = utils.rendertmpl('grades');
			this.listenToOnce(this, "render", this.prepareGrade);

			this.grades = new Grades();
			this.listenTo(this.grades, "error", this.requestFail);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#gradesHost', msg: 'Zurzeit nicht verfügbar.', module: 'grades', err: error});
		},

		prepareGrade: function() {
			new GradesView({model: this.grades, el: this.$("#gradesTable")});
			//new GradeAveragesView({model: this.grades, el: this.$("#averageData")});
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

	return GradesPageView;
});