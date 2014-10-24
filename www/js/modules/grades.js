define(['jquery', 'underscore', 'backbone', 'utils', 'Session'], function($, _, Backbone, utils, Session){

	var Grades = Backbone.Collection.extend({

		initialize: function(){
			// get Session information for username / password
			this.session = new Session();
			this.url = "https://api.uni-potsdam.de/endpoints/pulsAPI?action=acm&auth=H2LHXK5N9RDBXMB&datatype=json";
			this.url += "&user=" + encodeURIComponent(this.session.get('up.session.username'));
			this.url += "&password=" + encodeURIComponent(this.session.get('up.session.password'));
		},

		parse: function(result) {
			return result;
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
			this.listenTo(this.grades, "error", this.requestFail);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#gradesHost', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'grades', err: error});
		},

		prepareGrade: function() {
			new GradesView({collection: this.grades, el: this.$("#gradesTable")});
			new utils.LoadingView({collection: this.grades, el: this.$("#loadingSpinner")});
			
			this.grades.fetch();
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
