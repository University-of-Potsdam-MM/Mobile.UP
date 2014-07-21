define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){

	var Grades = Backbone.Collection.extend({
		
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
	
	var PasswordInputView = Backbone.View.extend({
		
		events: {
			"click #login": "login"
		},
		
		login: function(ev) {
			ev.preventDefault();
			
			console.log("Loginvorgang gestartet");
			
			var user = $("input[name='benutzer']").val();
			var pw = $("input[name='password']").val();
			
			this.collection.url = "https://fossa.soft.cs.uni-potsdam.de:8243/services/pulsAPI?action=acm&auth=H2LHXK5N9RDBXMB";
			this.collection.url += "&user=" + encodeURIComponent(user);
			this.collection.url += "&password=" + encodeURIComponent(pw);
			
			this.collection.fetch();
		}
	});
	
	var GradesPageView = Backbone.View.extend({
		attributes: {"id": "grades"},

		initialize: function(){
			this.template = utils.rendertmpl('grades');
			this.listenToOnce(this, "render", this.prepareGrade);
			
			this.grades = new Grades;
			this.listenTo(this.grades, "error", this.requestFail);
		},
		
		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#gradesHost', msg: 'Der PULS-Dienst ist momentan nicht erreichbar.', module: 'grades', err: error});
		},
		
		prepareGrade: function() {
			new PasswordInputView({collection: this.grades, el: this.$("#loginForm")});
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
