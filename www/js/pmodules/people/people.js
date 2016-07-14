define([
		'jquery',
		'underscore',
		'backbone',
		'utils',
		'Session'
], function($, _, Backbone, utils, Session){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/people");


	/**
	 * 	BackboneModel - Person
	 */
	var Person = Backbone.Model.extend({
		parse: function(response){
			return response.Person;
		}
	});


	/**
	 * 	BackboneCollection - PersonList
	 */
	var PersonList = Backbone.Collection.extend({
		model: Person,

		url: function() {
			var session = new Session();

			var url = 'https://api.uni-potsdam.de/endpoints/personAPI/.json';
			url += '?value=' + this.query;
			url += '&username='+encodeURIComponent(session.get('up.session.username'));
			url += '&password='+encodeURIComponent(session.get('up.session.password'));
			return url;
		},

		parse:function(response){
			if (response.people[0] && response.people[0].length != 0){
				return response.people;
			}else{
				return [];
			}
		}
	});


	/**
	 * 	BackboneView - PersonView
	 */
	var PersonView = Backbone.View.extend({
		attributes: {"data-role": 'collapsible', "data-iconpos" : 'right', "data-collapsed-icon" : 'arrow-down', "data-expanded-icon" : 'arrow-up' },
		model: Person,

		initialize: function(){
			this.template = rendertmpl('person');
		},

		render: function(){
			this.$el.html(this.template({person: this.model}));
			return this;
		}
	});


	/**
	 *	BackvoneView - PeoplePageView
	 */
	app.views.PeoplePage = Backbone.View.extend({
		attributes: {"id": "people"},

		events: {
			'submit form': 'submit'
		},

		initialize: function(){
			this.collection = new PersonList();
			this.session = new Session();
			this.template = rendertmpl('people');
			this.listenTo(this.collection, "error", this.requestFail);
			this.listenTo(this.collection, "sync", this.enableSearch);
			this.listenTo(this.collection, "sync", this.checkForEmptyResult);
			this.collection.bind("reset", this.clearList);
			this.collection.bind("add", this.addPerson);
		},

		enableSearch: function(){
			$("input[type='submit']").removeAttr('disabled');
		},

		checkForEmptyResult: function() {
			if (this.collection.isEmpty()) {
				new utils.ErrorView({el: '#people-list', msg: 'Keine Ergebnisse gefunden.', module: 'people'});
			}
		},

		clearList: function(){
			$("#people-list").empty();
		},

		addPerson: function(model){
			var personView = new PersonView({model: model});
			$("#people-list")
				.append(personView.render().el)
				.trigger("create");
			return this;
		},

		submit: function(ev){
			ev.preventDefault();
			$("input[type='submit']").prop("disabled", true);
			// get search query
			var inputs = $('#query-form').find(':input').serializeArray();
      		var query = inputs[0].value;

      		if (query){
      			this.collection.reset();
				this.collection.query = query;
				this.collection.fetch();
			} else {
				new utils.ErrorView({el: '#people-list', msg: 'Keine Ergebnisse gefunden.', module: 'people'});
				this.enableSearch();
			}
		},

		requestFail: function(collection, response) {
			console.log("error: "+response.status);
			new utils.ErrorView({el: '#people-list', msg: 'Die Personensuche ist momentan nicht erreichbar.', module: 'people', err: response.error});
			this.enableSearch();
		},

		render: function(){
			this.$el.html(this.template({}));
			this.LoadingView = new utils.LoadingView({collection: this.collection, el: this.$("#loadingSpinner")});
			this.$el.trigger("create");
			return this;
		}
	});

  return app.views.PeoplePage;
});