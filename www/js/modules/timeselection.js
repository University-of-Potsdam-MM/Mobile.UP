define(['jquery', 'underscore', 'backbone', 'jquerymobile', 'underscore-string'], function($, _, Backbone){

	var TimeSlot = Backbone.Model.extend({
		defaults: {
			isDefault: false,
			name: "Bezeichner",
			center: undefined,
			bounds: undefined,
			hourOffset: 0
		},

		initialize: function() {
			var offset = this.get("hourOffset");

			var then = new Date();
			then.setHours(then.getHours() + offset);
			var bounds = this.calculateUpperAndLowerDate(then);

			this.set("center", then);
			this.set("bounds", bounds);
		},

		calculateUpperAndLowerDate: function(center) {
			var lowerHour = center.getHours() - (center.getHours() % 2);
			var upperHour = lowerHour + 2;

			var lower = new Date(center.getFullYear(), center.getMonth(), center.getDate(), lowerHour, 0, 0, 0);
			var upper = new Date(center.getFullYear(), center.getMonth(), center.getDate(), upperHour, 0, 0, 0);
			return {upper: upper, lower: lower};
		}
	});

	var TabButtonView = Backbone.View.extend({
		tagName: "li",

		events: {
			"click": "activate"
		},

		render: function() {
			var href = $('<a href="#" class="time-menu"></a>');
			href.append(this.createLabel());

			if (this.model.get("isDefault")) {
				href.addClass("ui-btn-active");
			}

			this.$el.append(href);
			return this;
		},

		createLabel: function() {
			var upper = this.model.get("bounds").upper;
			var lower = this.model.get("bounds").lower;
			var name = this.model.get("name");
			return _.str.sprintf("%s (%02d:%02d-%02d:%02d)", name, lower.getHours(), lower.getMinutes(), upper.getHours(), upper.getMinutes());
		},

		activate: function(e) {
			event.preventDefault();
			this.trigger("activate", this);
		}
	});

	$.widget("up.timeselection", {
		options: {
			onChange: function(bounds) {}
		},

		_create: function() {
			// Create HTML basis
			this.element.append(
				'<div data-role="controlgroup"> \
					<h3>Zeitraum:</h3> \
					<div data-role="navbar" id="timeNavbar"> \
						<ul></ul> \
					</div> \
				</div>');

			// Create tab data
			var now = new TimeSlot({name: "Jetzt", isDefault: true});
			var then = new TimeSlot({name: "Demnächst", hourOffset: 2});

			// Create tab views
			_.each([now, then], function(model) {
				var view = new TabButtonView({model: model});
				$(this.element).find("ul").append(view.render().el);

				var localActivate = $.proxy(this.activate, this);
				view.on("activate", localActivate);
			}, this);

			// Activate jQuery magic
			this.element.trigger("create");
			this.activeModel = now;
		},

		_destroy: function() {
		},

		_setOption: function(key, value) {
			this._super(key, value);
		},

		activate: function(view) {
			this.activeModel = view.model;

			var bounds = this.activeModel.get("bounds");
			this.options.onChange({ from: bounds.lower, to: bounds.upper });

			// For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
			var target = view.$el.find("a");
			$("a", this.element).removeClass("ui-btn-active");
			target.addClass("ui-btn-active");
		},

		pageshow: function() {
		},

		getActive: function() {
			var bounds = this.activeModel.get("bounds");
			return { from: bounds.lower, to: bounds.upper };
		}
	});
});