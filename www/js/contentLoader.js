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

        initContentAndData: function (c) {
            var content = false;
            if (!app.data[c])
                app.data[c] = {};
            return content;
        },

        setFetchedContent: function (content, s, d, params, response, c, a, _) {
            console.log('content');
            if (content.fetchSuccess)
                content.fetchSuccess(s, d);
            content.p = params;
            if (content.beforeRender)
                content.beforeRender();
            if (s == 'set') { //Model aus collection geholt
                if (content.model) {
                    content.model.set(d);
                    content.model.p = params;
                }
            } else if (s == 'cached') { //Daten aus dem Cache geholt
                if (content.model) {
                    content.model.set(content.model.parse(d));
                    content.model.p = params;
                }
                if (content.collection) {
                    content.collection.set(content.collection.parse(d));
                    content.collection.p = params;
                }
            } else { //Daten vom Server geholt
                if (content.collection) {
                    response = d = content.collection.toJSON();
                    content.collection.p = params;
                    if (content.collection.response)
                        response = content.collection.response;
                }

                if (content.model && content.model.toJSON) {
                    response = d = content.model.toJSON();
                    content.model.p = params;
                    if (content.model.response)
                        response = content.model.response;
                }
            }
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
            return {d: d, response: response};
        },

        resolveWithContent: function (response, q, content, d, _) {
            if (_.keys(response).length > 0)
                q.resolve(response, content);
            else
                q.resolve(d, content);
        },

        retreiveElementFromLoadedCollection: function (content, params, d, _) {
            if ((content.model || content.collection) && content.inCollection) { //Element aus der geladenen Collection holen und nicht vom Server
                var parts = content.inCollection.split('.');
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
            return d;
        },

        retreiveOrFetchContent: function (content, success, d, $, utils, _) {
            if (content.collection) { //Content hat eine Collection
                if (this.appCache.getCache(content.collection.url)) {
                    success('cached', this.appCache.getCache(content.collection.url));
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
                    success('set', d);
                }
                else if (this.appCache.getCache(content.model.url)) { //Model in cache
                    success('cached', this.appCache.getCache(content.model.url));
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
        }
    };

    return ContentLoader;
});
