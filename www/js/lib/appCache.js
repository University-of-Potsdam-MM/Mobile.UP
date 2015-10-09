define([
    'jquery',
    'underscore',
    'backbone',
    'utils'
], function($, _, Backbone, utils) {

    var Cache = Backbone.Model.extend({
        cacheTimes: [], //Speichert für jede URL die letzte Zeit, wann diese vom Server geladen wurde
        cache: {},

        setCache: function(url, response) {
            this.cache[url] = response;
        },

        getCache: function(url) {
            return this.cache[url];
        }
    });

    return Cache;
});
