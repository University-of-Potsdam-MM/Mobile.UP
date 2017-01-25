define([
	'jquery',
	'underscore',
	'backbone',
	'underscore.string',
	'modules/campusmenu',
	'jquerymobile'
], function($, _, Backbone, _str, campusmenu) {

	var TimeSlots = campusmenu.TabModel.extend({

		initialize: function() {
			// Create tab data
			var now = new TimeSlot({name: "Jetzt", isDefault: true});
			var then = new TimeSlot({name: "Demnächst", hourOffset: 2});

			this.set("locations", [
				{ id: "now", name: now.get("label"), bounds: now.get("bounds") },
				{ id: "then", name: then.get("label"), bounds: then.get("bounds") }
			]);
			this.set("activeLocation", "up.rooms.default");
		}
	});

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
			this.set("label", this.createLabel());
		},

		createLabel: function() {
			var upper = this.get("bounds").upper;
			var lower = this.get("bounds").lower;
			var name = this.get("name");
			return _str.sprintf("%s (%02d:%02d-%02d:%02d)", name, lower.getHours(), lower.getMinutes(), upper.getHours(), upper.getMinutes());
		},

		calculateUpperAndLowerDate: function(center) {
			var lowerHour = center.getHours() - (center.getHours() % 2);
			var upperHour = lowerHour + 2;

			var lower = new Date(center.getFullYear(), center.getMonth(), center.getDate(), lowerHour, 0, 0, 0);
			var upper = new Date(center.getFullYear(), center.getMonth(), center.getDate(), upperHour, 0, 0, 0);
			return {upper: upper, lower: lower};
		}
	});

	return {
		TimeSlots: TimeSlots
	}
});