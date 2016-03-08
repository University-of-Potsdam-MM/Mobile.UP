define(['jquery', 'underscore', 'backbone', 'utils'], function($, _, Backbone, utils){
    var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/lectures");

    // Helping the eclipse JS Tools by declaring the variable here
    var VvzCollection = undefined;
    var VvzCourseCollection = undefined;

    var VvzItem = Backbone.Model.extend({
        defaults: {
            "name": "Vorlesungsverzeichnis"
        },

        initialize: function() {
            this.set("suburl", this.createSubUrl());
        },

        createSubUrl: function() {
            var result = "https://api.uni-potsdam.de/endpoints/pulsAPI/1.0?action=vvz";
            result += "&auth=H2LHXK5N9RDBXMB";
            result += this.getIfAvailable("url", "&url=");
            result += this.getIfAvailable("level", "&level=");
            return result;
        },

        getIfAvailable: function(attribute, pretext) {
            if (this.get(attribute)) {
                return pretext + encodeURIComponent(this.get(attribute));
            } else {
                return "";
            }
        }
    });

    var CurrentVvz = Backbone.Model.extend({

        initialize: function() {
            this.items = new VvzCollection();
        },

        load: function(vvzHistory) {
            var vvzUrl = vvzHistory.first().get("suburl")

            this.items.url = vvzUrl;
            this.items.reset();
            this.items.fetch(utils.cacheDefaults({reset: true}));
        }
    });

    VvzCollection = Backbone.Collection.extend({
        model: VvzItem,

        parse: function(response) {
            var rawCategories = this.ensureArray(response.listitem.subitems.listitem);
            var categories = _.map(rawCategories, function(model) {
                model.isCategory = true;
                return model;
            });

            var rawCourses = this.ensureArray(response.listitem.subitems.course);
            var courses = _.map(rawCourses, function(model) {
                model.isCourse = true;
                return model;
            });

            return _.union(categories, courses);
        },

        ensureArray: function(param) {
            if (!param) {
                return param;
            } else if (Array.isArray(param)) {
                return param;
            } else {
                return [param];
            }
        }
    });

    var VvzHistory = Backbone.Collection.extend({

        initialize: function() {
            this.listenTo(this, "add", this.triggerVvzChange);
            this.listenTo(this, "reset", this.triggerVvzChange);
        },

        openVvz: function(vvzItem) {
            var current = vvzItem.pick("name", "suburl");
            this.add(current, {at: 0});
        },

        resetToUrl: function(modelUrl) {
            var model = this.find(function(element) { return element.get("suburl") == modelUrl; });
            var remainingModels = this.last(this.length - this.indexOf(model));

            this.reset(remainingModels);
        },

        triggerVvzChange: function() {
            if (this.isEmpty()) {
                // Triggers a new function call
                this.add(new VvzItem());
            } else {
                this.trigger("vvzChange", this);
            }
        }
    });

    return {
        VvzItem: VvzItem,
        CurrentVvz: CurrentVvz,
        VvzCollection: VvzCollection,
        VvzHistory: VvzHistory
    };
});
