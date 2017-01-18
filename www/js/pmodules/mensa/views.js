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
			this.subviews = [];
		},
		
		render: function() {
			this._cleanSubviews();
			this.$el.html(this.template({
				meals: this.collection.toJSON(),
				location: this.collection.location
			}));

			var list = this.$(".speiseplan");
			if (list.length > 0) {
				this.subviews.push(new viewUtils.ListView({
					el: list,
					collection: this.collection,
					view: MealView,
					postRender: function() {
						this.$el.collapsibleset().collapsibleset("refresh");
					}
				}).render());
			}

			this.$el.trigger("create");
			return this;
		},

		_cleanSubviews: function() {
			_.each(this.subviews, function(view) {
				view.remove();
			});
			this.subviews = [];
		},

		remove: function() {
			this._cleanSubviews();
			Backbone.View.prototype.remove.apply(this, arguments);
		}
	});

	var LocationTabView = Backbone.View.extend({

		initialize: function(params) {
			this.template = rendertmpl("mensa.tab");
			this.menus = params.menus;
			this.subviews = [];

			_.each(this.menus, function(menu) {
				this.listenTo(menu, "sync", this.render);
				this.listenTo(menu, "error", this.requestFail);
			}, this);
		},

		requestFail: function(error) {
			this.trigger("requestFail", error);
		},

		render: function() {
			this._cleanSubviews();
			this.$el.html(this.template({}));

			// Add all meal sources
			_.each(this.menus, function(menu, index) {
				this.$("#menu-list").append('<div id="loadingSpinner' + index + '"></div>');
				this.$("#menu-list").append('<div id="content' + index + '"></div>');

				this.subviews.push(new utils.LoadingView({collection: menu, el: this.$('#loadingSpinner' + index)}));
				this.subviews.push(new DayView({collection: menu, el: this.$('#content' + index)}).render());
			}, this);

			this.$el.trigger("create");
			return this;
		},

		_cleanSubviews: function() {
			_.each(this.subviews, function(view) {
				view.remove();
			});
			this.subviews = [];
		},

		remove: function() {
			this._cleanSubviews();
			Backbone.View.prototype.remove.apply(this, arguments);
		}
	});

	app.views.MensaPage = Backbone.View.extend({
		attributes: {"id": 'mensa'},

		events: {
			'click .ui-input-datebox a': 'dateBox'
		},

		initialize: function() {
			_.bindAll(this, 'render', 'updateMenuCampus', 'updateMenu');
			this.template = rendertmpl('mensa');
			this.model = new models.AllMenus;
			this.subviews = [];
		},

		delegateCustomEvents: function() {
			this.$("div[data-role='campusmenu']").campusmenu({ onChange: this.updateMenu });
			this.$("#mydate").bind("datebox", this.updateMenuCampus);
		},

		updateMenuCampus: function(e, p) {
			if (p.method === "set") {
				this.model.set("date", p.date);
			}
		},

		updateMenu: function(options) {
			var mensa = options.campusName;

			_.each(["griebnitzsee", "neuespalais", "golm"], function(campus) {
				var element = this.$("#" + campus + "-speiseplan");
				if (campus === mensa) {
					element.show();
				} else {
					element.hide();
				}
			}, this);
		},

		requestFail: function(error) {
			var errorPage = new utils.ErrorView({el: '#todaysMenu', msg: 'Der Mensa-Dienst ist momentan nicht erreichbar.', module: 'mensa', err: error});
		},

		dateBox: function(ev){
			ev.preventDefault();
		},

		render: function() {
			this._cleanSubviews();
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			_.each(["griebnitzsee", "neuespalais", "golm"], function(campus) {

				var locationTab = new LocationTabView({
					el: this.$("#" + campus + "-speiseplan"),
					menus: this.model.get(campus)
				});
				this.subviews.push(locationTab);
				this.listenTo(locationTab, "requestFail", this.requestFail);
				locationTab.render();

			}, this);
			this.model.fetchAll(utils.cacheDefaults());

			this.delegateCustomEvents();
			this.$("div[data-role='campusmenu']").campusmenu("pageshow");

			return this;
		},

		_cleanSubviews: function() {
			_.each(this.subviews, function(view) {
				view.remove();
			});
			this.subviews = [];
		},

		remove: function() {
			this._cleanSubviews();
			Backbone.View.prototype.remove.apply(this, arguments);
		}
	});

	return app.views.MensaPage;
});