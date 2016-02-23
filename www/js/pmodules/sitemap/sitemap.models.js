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

            this.set("id", this.get("geo").features[0].properties.id);
            this.set("name", this.get("geo").features[0].properties.Name);
            this.set("description", this.get("geo").features[0].properties.description);
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

    var GeoCollection = Backbone.Collection.extend({
        url: "js/geojson/campus-geo.json",
        model: GeoBlock,

        /**
         * Ensures that each GeoBlock contains exactly one element in its features array.
         * If more elements are present, the GeoBlock is split into several GeoBlocks with
         * one element per array.
         *
         * @param campusAndCategory Attributes of one GeoBlock
         * @returns {*} Array of GeoBlock
         * @private
         */
        _isolateFeatures: function(campusAndCategory) {
            if (!campusAndCategory || !campusAndCategory.geo || !campusAndCategory.geo.features) {
                return campusAndCategory;
            }

            return _.map(campusAndCategory.geo.features, function(feature) {
                var result = _.omit(campusAndCategory, "geo");
                result.geo = _.omit(campusAndCategory.geo, "features");
                result.geo.features = [feature];
                return result;
            });
        },

        parse: function(response) {
            return _.chain(response)
                .map(this._isolateFeatures)
                .flatten()
                .value();
        }
    });

    var SearchableGeoCollection = GeoCollection.extend({

        findHouseNumberOnOtherCampuses: function(house, currentCampus) {
            return this.chain()
                .filter(function(item) { return item.get("campus").toLowerCase() != currentCampus.toLowerCase(); })
                .filter(function(item) { return item.get("name") === house; })
                .value();
        },

        findDescriptionOnOtherCampuses: function(search, currentCampus) {
            return this.chain()
                .filter(function(item) { return item.get("campus").toLowerCase() != currentCampus.toLowerCase(); })
                .filter(function(item) { return (item.get("description") || "").indexOf(search) !== -1; })
                .value();
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
                var categories = _.chain(data)
                    .filter(function(element) { return element.get("category") === category})
                    .map(function(element) { return element.get("geo"); })
                    .value();

                if (categories.length > 0) {
                    var base = categories[0];
                    var geoByCategory = _.omit(base, "features");
                    geoByCategory.features = _.map(categories, function(category) {
                        return category.features[0];
                    });
                    return geoByCategory;
                } else {
                    return undefined;
                }
            };

            var hasSimilarLocations = function(campus) {
                return function(id) {
                    var entry = geo.get(id);
                    var similarHouses = geo.findHouseNumberOnOtherCampuses(entry.get("name"), campus);
                    var similarDescriptions = geo.findDescriptionOnOtherCampuses(entry.get("description"), campus);

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
        GeoBlock: GeoBlock,
        GeoCollection: GeoCollection,
        SearchableGeoCollection: SearchableGeoCollection
    };
});
