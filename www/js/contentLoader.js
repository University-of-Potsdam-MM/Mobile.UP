define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore-string',
    'utils',
    'q',
    'history'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory) {

    var AppCache = Backbone.Model.extend({
        cacheTimes: [], //Speichert für jede URL die letzte Zeit, wann diese vom Server geladen wurde
        cache: {},

        setCache: function(url, response) {
            this.cache[url] = response;
        },

        getCache: function(url) {
            return this.cache[url];
        }
    });

    var ContentLoader = {
        appCache : new AppCache(),

        initData: function (c) {
            if (!app.data[c])
                app.data[c] = {};
        },

        setFetchedContent: function (content, s, d, params, c, a) {
            var response = {};
            console.log('content');
            if (content.fetchSuccess)
                content.fetchSuccess(s, d);
            content.p = params;
            if (content.beforeRender)
                content.beforeRender();

            var setDataCallback = function() {};

            if (typeof(s) == "function") {
                s();
            } else if (s == 'set') { //Model aus collection geholt
                if (content.model) {
                    // Is already handled by function call
                }
            } else if (s == 'cached') { //Daten aus dem Cache geholt
                if (content.model) {
                    // Is already handled by function call
                } else if (content.collection) {
                    // Is already handled by function call
                }
            } else { //Daten vom Server geholt
                if (content.collection) {
                    setDataCallback = function() {
                        var response = content.collection.toJSON();
                        content.collection.p = params;
                        if (content.collection.response)
                            response = content.collection.response;
                        return response;
                    };
                } else if (content.model && content.model.toJSON) {
                    setDataCallback = function() {
                        var response = content.model.toJSON();
                        content.model.p = params;
                        if (content.model.response)
                            response = content.model.response;
                        return response;
                    };
                }
            }
            var tmp = setDataCallback();
            if (tmp) {
                response = d = tmp;
            }

            // If we have a response from a server call -> save it
            if (_.keys(response).length > 0) {
                if (!app.data[c])
                    app.data[c] = {};
                app.data[c][a] = response; //Daten speichern
                if (content.model)
                    this.appCache.setCache(content.model.url, response);
                else if (content.collection) {
                    this.appCache.setCache(content.collection.url, response);
                }
            }
            return d;
        },

        retreiveOrFetchContent: function (content, d, params, c, a, success) {
            // Save the original callback so we can call it as soon as the fetch is processed
            var originalSave = success;
            success = _.bind(function(s, d) {
                if (content) {
                    d = this.setFetchedContent(content, s, d, params, c, a);
                }
                originalSave(d);
            }, this);

            if ((content.model || content.collection) && content.inCollection) { //Element aus der geladenen Collection holen und nicht vom Server
                try {
                    var list = eval('app.data.' + content.inCollection);
                } catch (e) {
                }
                if (list) {
                    try {
                        var filteredList = _.filter(list, function (item) {
                            return _.some(item, function (item) {
                                return eval('item.' + content.idInCollection) == params.id;
                            });
                        });
                    } catch (e) {
                    }
                }
                if (filteredList) //Element in Liste gefunden
                    d = filteredList[0];
            }

            if (content.collection) { //Content hat eine Collection
                if (this.appCache.getCache(content.collection.url)) {
                    success(_.bind(function() {
                        var d = this.appCache.getCache(content.collection.url);
                        content.collection.set(content.collection.parse(d));
                        content.collection.p = params;
                    }, this), this.appCache.getCache(content.collection.url));
                } else if (content.collection.url && (!content.model || typeof content.model.url != 'function')) { //Collection abrufbar von URL
                    content.collection.fetch({
                        success: success,
                        error: function () {
                        },
                        dataType: 'json'
                    });
                } else {
                    success();
                }
            } else if (content.model) { //Content hat ein Model
                console.log('Model');
                if (_.keys(d).length > 0) { //Model bereits in Collection gefunden
                    success(_.bind(function() {
                        content.model.set(d);
                        content.model.p = params;
                    }, this), d);
                } else if (this.appCache.getCache(content.model.url)) { //Model in cache
                    success(_.bind(function() {
                        var d = this.appCache.getCache(content.model.url);
                        content.model.set(content.model.parse(d));
                        content.model.p = params;
                    }, this), this.appCache.getCache(content.model.url));
                } else if (content.model.url && typeof content.model.url != 'function') { //Model abrufbar von URL
                    console.log(content.model);
                    content.model.fetch($.extend(utils.cacheDefaults(), {
                        success: success,
                        error: function () {
                        },
                        dataType: 'json'
                    }));
                } else {
                    success();
                }
            } else { //Content einfach so
                success();
            }

            return d;
        }
    };

    return ContentLoader;
});
