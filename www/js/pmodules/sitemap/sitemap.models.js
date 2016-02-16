define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'q',
    'modules/campusmenu',
    'modules/timeselection',
    'pmodules/sitemap/searchablemap'
], function($, _, Backbone, utils, Q, campusmenu, timeselection, searchablemap) {

    var GeoBlock = Backbone.Model.extend({

        initialize: function() {
            this.insertId(this.get("geo"));
        },

        /**
         * Inserts IDs into the properties objects of the given parameter.
         *
         * The expected structure is:
         * "geo": {
		 *     features: [ {
		 *         "properties": {
		 *             "Name": ...,
		 *             "description": ...
		 *         }
		 *     } ]
		 * }
         */
        insertId: function(geo) {
            _.each(geo.features, function(feature) {
                feature.properties.id = _.uniqueId();
            });
        }
    });

    /**
     * - displayOptions
     * - featureCollection
     * - category
     * - hasSimilarsCallback
     */
    var CampusMapModel = Backbone.Model.extend({});

    var CampusMapCollection = Backbone.Collection.extend({
        model: CampusMapModel,

        initialize: function(models, options) {
            this.geo = options.geo;
            this.campus = options.campus;
            this.settings = options.settings;
        },

        parse: function(geo) {
            var result = [];

            var campus = this.campus;
            var data = geo.filter(function(element) { return element.get("campus") === campus; });

            var getGeoByCategory = function(data, category) {
                var result = _.chain(data)
                    .filter(function(element) { return element.get("category") === category; })
                    .first()
                    .value();
                if (result) {
                    return result.get("geo");
                } else {
                    return undefined;
                }
            };

            var hasSimilarLocations = function(campus) {
                return function(id) {
                    var entry = geo.findEntryById(id);
                    var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.geo.properties.Name, campus);
                    var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.geo.properties.description, campus);

                    return similarHouses.length + similarDescriptions.length > 0;
                };
            };

            var insertCategory = _.bind(function(categoryName) {
                var categoryData = getGeoByCategory(data, categoryName);
                var options = this.settings.options[categoryName];
                var category = categoryName;
                var campus = this.campus;

                var model = {displayOptions: options, featureCollection: categoryData, category: category, hasSimilarsCallback: hasSimilarLocations(campus)};

                if (model.featureCollection) {
                    result.push(model);
                }
            }, this);

            _.each(this.settings.options, function(categoryValue, categoryName) {
                insertCategory(categoryName);
            });

            return result;
        },

        sync: function(method, collection, options) {
            if (method !== 'read') {
                return Backbone.Collection.prototype.sync.apply(this, arguments);
            }

            var result = new $.Deferred();

            this.geo.fetch({
                success: function(data) {
                    result.resolve(data);
                    options.success(data);
                }, error: function(error) {
                    result.reject(error);
                    options.error(error);
                }});

            return result.promise();
        }
    });

    var Campus = Backbone.Model.extend({});

    return {
        CampusMapModel: CampusMapModel,
        CampusMapCollection: CampusMapCollection,
        Campus: Campus,
        GeoBlock: GeoBlock
    };
});
