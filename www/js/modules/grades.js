define(['jquery', 'underscore', 'backbone', 'utils', 'Session'], function($, _, Backbone, utils, Session){

	var Grades = Backbone.Collection.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();
			this.url = "https://api.uni-potsdam.de/endpoints/pulsAPI?action=acm&auth=H2LHXK5N9RDBXMB";
			this.url += "&user=" + encodeURIComponent(this.session.get('up.session.username'));
			this.url += "&password=" + encodeURIComponent(this.session.get('up.session.password'));
		},

		parse: function(result) {
			return result.achievements.acm;
		}
	});

	var GradesView = Backbone.View.extend({

		initialize: function() {
			this.template = utils.rendertmpl("gradeList");
			this.listenTo(this.collection, "sync", this.render);
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this.template({grades: this.collection.toJSON()}));
			this.$el.trigger("create");
		}
	});

	var GradesPageView = Backbone.View.extend({

		attributes: {"id": "grades"},

		initialize: function(){
			this.template = utils.rendertmpl('grades');
			this.listenToOnce(this, "render", this.prepareGrade);
			this.grades = new Grades();
			this.grades.bind('request', this.spinnerOn, this);
			this.grades.bind('sync', this.spinnerOff, this);
			this.listenTo(this.grades, "error", this.requestFail);
		},

		spinnerOn: function(){
			this.$el.find('#gradesHost').append("<div class=\"up-loadingSpinner\" style=\"margin-top: 50px;\"> \
													<img src=\"img/loadingspinner.gif\"></img> \
												</div>");
		},

		spinnerOff: function(){
			this.$el.find('#gradesHost .up-loadingSpinner').remove();
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#gradesHost', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'grades', err: error});
		},

		prepareGrade: function() {
			this.grades.fetch();
			new GradesView({collection: this.grades, el: this.$("#gradesTable")});
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