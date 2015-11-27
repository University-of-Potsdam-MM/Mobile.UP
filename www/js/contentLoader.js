define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore.string',
    'utils',
    'q',
    'history'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory) {

    var InMemoryCache = Backbone.Model.extend({

        get: function(key) {
            var result = Backbone.Model.prototype.get.apply(this, arguments);
            if (!result) {
                return {};
            } else {
                return result;
            }
        }
    });

    return {
        InMemoryCache: InMemoryCache
    };
});
