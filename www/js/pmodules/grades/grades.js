define(['jquery', 'underscore', 'backbone', 'utils', 'Session', 'pmodules/grades/grades.common'], function($, _, Backbone, utils, Session, grades){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/grades");

	var GradesView = Backbone.View.extend({

		events: {
			"click .grades-tabs-links": "tabClick"
		},

		initialize: function() {
			this.template = rendertmpl("gradeList");
			this.moduleTemplate = rendertmpl("gradeList.module");
			this.listenTo(this.model, "sync", this.render);
		},

		/**
		 * We want to prevent the url from changing, but in return we have to change the button color of the active tab ourselves.
		 */
		tabClick: function(ev) {
			ev.preventDefault();

			$(".ui-btn-active", ev.currentTarget).first().removeClass("ui-btn-active");
			$(ev.target).addClass("ui-btn-active");

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

	app.views.GradesSelection = Backbone.View.extend({

		initialize: function() {
			this.template = rendertmpl('grades.selection');
			this.listenToOnce(this, "render", this.loadSelection);

			this.collection = new grades.StudentDetails();
			this.listenTo(this.collection, "error", this.requestFail);
		},

		loadSelection: function () {
			new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});

			var that = this;
			this.collection.fetch(utils.cacheDefaults({
				success: function(collection) {
					if (collection.length == 1) {
						var first = collection.at(0);
						app.route("grades/view/" + first.get("Semester") + "/" + first.get("MtkNr") + "/" + first.get("StgNr"));
					} else {
						that.render();
					}
				}
			}));
		},

		requestFail: function(error, response) {
			if (!response.msg) { response.msg = 'Zurzeit nicht verfügbar.'; }
			new utils.ErrorView({el: '#studentDetails', msg: response.msg, module: 'grades', err: error});
		},

		render: function() {
			this.setElement(this.page);

			this.$el.html(this.template({data: this.collection.toJSON()}));
			this.$el.trigger("create");

			this.trigger("render");
			return this;
		}
	});

	app.views.GradesView = Backbone.View.extend({

		initialize: function(options){
			this.template = rendertmpl('grades');
			this.listenToOnce(this, "render", this.prepareGrade);

			this.grades = new grades.Grades();
			this.grades.studentDetails = options.studentDetails;
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
			this.setElement(this.page);

			$(this.el).html(this.template({}));
			$(this.el).trigger("create");
			this.trigger("render");
			return this;
		}
	});

	app.views.GradesPage = Backbone.View.extend({

		attributes: {"id": "grades"},

		render: function(){
			this.$el.html("");
			return this;
		}
	});

	return app.views.GradesPage;
});