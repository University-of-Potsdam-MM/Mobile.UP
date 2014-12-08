define([
		'jquery',
		'underscore',
		'backbone',
		'utils',
		'Session'
], function($, _, Backbone, utils, Session){


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

		parse:function(response){
			if (response.people[0] && response.people[0].length != 0){
				return response.people;
			}else{
				return null;
			}
		}
	});


	/**
	 * 	BackboneView - PersonView
	 */
	var PersonView = Backbone.View.extend({
		attributes: {"data-role": 'collapsible'},
		model: Person,

		initialize: function(){
			this.template = utils.rendertmpl('person');
		},

		render: function(){
			this.$el.html(this.template({person: this.model}));
			return this;
		}
	});


	/**
	 *	BackvoneView - PeoplePageView
	 */
	var PeoplePageView = Backbone.View.extend({
		attributes: {"id": "people"},

		events: {
			'submit form': 'submit',
		},

		initialize: function(){
			this.collection = new PersonList();
			this.session = new Session();
			this.template = utils.rendertmpl('people'),
			this.listenTo(this.collection, "error", this.requestFail);
			this.listenTo(this.collection, "sync", this.enableSearch);
			this.collection.bind("reset", this.clearList);
			this.collection.bind("add", this.addPerson);
		},

		enableSearch: function(){
			$("input[type='submit']").removeAttr('disabled');
		},

		clearList: function(){
			$("#people-list").empty();
		},

		addPerson: function(model){
			personView = new PersonView({model: model});
			$("#people-list").append(personView.render().el);
			$("#people-list").trigger("create");
			return this;
		},

		submit: function(ev){
			ev.preventDefault();
			$("input[type='submit']").prop("disabled", true);
			// get search query
			var inputs = $('#query-form :input').serializeArray();
      		var query = inputs[0].value;
			// generate url and set collection url
			var url = 'https://api.uni-potsdam.de/endpoints/personAPI/.json';
			url += '?value='+query;
			url += '&username='+encodeURIComponent(this.session.get('up.session.username'));
			url += '&password='+encodeURIComponent(this.session.get('up.session.password'));

			this.collection.reset();
			this.collection.url = url;
			this.collection.fetch();
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#people-list', msg: 'Die Personensuche ist momentan nicht erreichbar.', module: 'people', err: error});
		},

		render: function(){
			this.$el.html(this.template({}));
			this.LoadingView = new utils.LoadingView({collection: this.collection, el: this.$("#loadingSpinner")});
			this.$el.trigger("create");
			return this;
		}
	});

  return PeoplePageView;
});