define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    var models = {};

    models.StatefulCollection = Backbone.Collection.extend({

        sync: function(method, collection, options) {
            // Clear loading error
            var that = this;
            that.loadError = undefined;

            // Log loading error
            var error = options.error || _.noop;
            options.error = function(jqXHR, textStatus, errorThrown) {
                that.loadError = {
                    jqXHR: jqXHR,
                    textStatus: textStatus,
                    errorThrown: errorThrown
                };
                error.apply(this, arguments);
            };

            return Backbone.Collection.prototype.sync.apply(this, arguments);
        }
    });

    models.StatefulModel = Backbone.Model.extend({

        sync: function(method, model, options) {
            // Clear loading error
            var that = this;
            that.loadError = undefined;

            // Log loading error
            var error = options.error || _.noop;
            options.error = function(jqXHR, textStatus, errorThrown) {
                that.loadError = {
                    jqXHR: jqXHR,
                    textStatus: textStatus,
                    errorThrown: errorThrown
                };
                error.apply(this, arguments);
            };

            return Backbone.Model.prototype.sync.apply(this, arguments);
        }
    });

    return models;
});
