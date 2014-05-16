(function($){

	// Backbone code - start
	/*
	 * Models
	 */
	// model for emergency items
	var Person = Backbone.Model.extend({
	});

	// collection for emergency items
	var People = Backbone.Collection.extend({
		model: Person,
		url: 'js/json/people.json'
	});

	/*
	 * Views
	 */
	// view for single emergency call
	var PersonView = Backbone.View.extend({
		tagName: 'div',
		//attributes: {"data-role": "collapsible"},
		template: null,

		initialize: function(){
			_.bindAll(this, 'render');
			this.template = rendertmpl('person');
		},

		render: function(){
			$(this.el).html(this.template({person: this.model}));
			return this;
		}
	});

	// view for several emergency calls
	var PeopleView = Backbone.View.extend({
		anchor: '#people-list',

		initialize: function(){
			_.bindAll(this, 'fetchSuccess', 'fetchError', 'render');
			this.collection.fetch({
				success: this.fetchSuccess,
				error: this.fetchError
			});
		},

		fetchSuccess: function() {
			this.render();
		},

		fetchError: function() {
			throw new Error('Error loading JSON file');
		},

		render: function(){
			this.el = $(this.anchor);
			// iterate over collection and call EmergencyCallViews render method
			this.collection.each(function(person){
				var person = new PersonView({model: person});
				$(this.el).append(person.render().el);
			}, this);
			this.el.trigger('create');
			return this;
		}
	});
	// Backbone code - end

	$(document).on("pageinit", "#people", function () {

		// create instance of our emergency collection
		var people = new People();

		// pass collection to emergency view
		var peopleView = new PeopleView({collection: people});

	});
})(jQuery);
