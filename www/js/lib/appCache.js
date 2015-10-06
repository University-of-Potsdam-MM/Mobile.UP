define([
    'jquery',
    'underscore',
    'backbone',
    'utils'
], function($, _, Backbone, utils) {

    var Cache = Backbone.Model.extend({
        requests : [], //Speichert die Rückgabe für jede URL (Cache)
        cacheTimes: [], //Speichert für jede URL die letzte Zeit, wann diese vom Server geladen wurde
        cache: {},

        setCache: function(url, response) {
            this.cache[url] = response;
        },

        getCache: function(url) {
            return this.cache[url];
        },

        /**
         * Alle 5 Stunden wird aktualisiert, sonst aus dem Cache holen, wenn vorhanden
         * @param url
         * @returns {*|boolean}
         */
        hasValidRequestEntry: function(url) {
            return this.requests[url] && this.cacheTimes[url] && Date.now() - this.cacheTimes[url] < 5 * 3600000;
        },

        getRequest: function(url) {
            return this.requests[url];
        },

        setRequest: function(url) {
            this.requests[url] = d;
            this.cacheTimes[url] = Date.now();
        }
    });

    return Cache;
});
