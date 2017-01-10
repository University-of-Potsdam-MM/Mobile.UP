define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'modules/campusmenu',
	'datebox',
	'view.utils',
	'pmodules/mensa/mensa.models'
], function($, _, Backbone, utils, campusmenu, datebox, viewUtils, models) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/mensa");

	var MealView = viewUtils.ElementView.extend({
		template: rendertmpl('mensa_meal'),
		postRender: function() {
			this.$el.trigger("create");
		}
	});

	var DayView = Backbone.View.extend({
		
		initialize: function() {
			this.template = rendertmpl('mensa_detail');
			this.listenTo(this.collection, "sync", this.render);
		},
		
		render: function() {
			this.$el.html(this.template({meals: this.collection.toJSON(), location: this.collection.location}));

			var list = this.$(".speiseplan");
			if (list.length > 0) {
				new viewUtils.ListView({
					el: list,
					collection: this.collection,
					view: MealView,
					postRender: function() {
						this.$el.collapsibleset().collapsibleset("refresh");
					}
				}).render();
			}

			this.$el.trigger("create");
			return this;
		}
	});

	var LocationTabView = Backbone.View.extend({

		initialize: function(params) {
			this.template = rendertmpl("mensa.tab");
			this.mensa = params.mensa;
			this.date = params.date;
		},

		requestFail: function(error) {
			this.trigger("requestFail", error);
		},

		render: function() {
			this.$el.html(this.template({}));

			// Add all meal sources
			_.each(models.createMenus(this.mensa, this.date), function(menu, index) {
				this.$("#menu-list").append('<div id="loadingSpinner' + index + '"></div>');
				this.$("#menu-list").append('<div id="content' + index + '"></div>');

				new utils.LoadingView({collection: menu, el: this.$('#loadingSpinner' + index)});
				new DayView({collection: menu, el: this.$('#content' + index)});
				this.listenTo(menu, "error", this.requestFail);

				menu.fetch(utils.cacheDefaults());
			}, this);

			this.$el.trigger("create");
			return this;
		}
	});

	app.views.MensaPage = Backbone.View.extend({
		attributes: {"id": 'mensa'},

		events: {
			'click .ui-input-datebox a': 'dateBox'
		},

		initialize: function() {
			_.bindAll(this, 'render', 'updateMenuData', 'updateMenuCampus');
			this.template = rendertmpl('mensa');
		},

		delegateCustomEvents: function() {
			this.$("div[data-role='campusmenu']").campusmenu({ onChange: this.updateMenuData });
			this.$("#mydate").bind("datebox", this.updateMenuCampus);
		},

		updateMenuData: function(options) {
			// The datebox may not be initiated yet, use the current date as default value
			var date;
			try {
				date = this.$("#mydate").datebox('getTheDate');
			} catch(error) {
				date = new Date();
			}

			this.updateMenu(options.campusName, date);
		},

		updateMenuCampus: function(e, p) {
			if (p.method === "set") {
				var source = this.$("div[data-role='campusmenu']").campusmenu("getActive");
				var date = p.date;
				this.updateMenu(source, date);
			}
		},

		updateMenu: function(mensa, date) {
		    var uniqueDivId = _.uniqueId("id_");
		    
		    this.$("#todaysMenu").empty();
			this.$("#todaysMenu").append('<div id="' + uniqueDivId + '"></div>');

			var locationTab = new LocationTabView({el: this.$("#" + uniqueDivId), mensa: mensa, date: date});
			this.listenTo(locationTab, "requestFail", this.requestFail);
			locationTab.render();
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
		},

		dateBox: function(ev){
			ev.preventDefault();
		},

		render: function() {
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			this.delegateCustomEvents();
			this.$("div[data-role='campusmenu']").campusmenu("pageshow");

			return this;
		}
	});

	return app.views.MensaPage;
});