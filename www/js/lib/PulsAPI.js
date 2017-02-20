define([
    'jquery',
    'underscore',
    'backbone',
    'Session',
    'uri/URI'
], function($, _, Backbone, Session, URI){

    var PulsAPI = {};

    PulsAPI.Model = Backbone.Model.extend({
        noAuth: false,

        asArray: function(subject) {
            if (Array.isArray(subject)) {
                return subject;
            } else if (subject) {
                return [subject];
            } else {
                return [];
            }
        },

        sync: function(method, model, options) {
            options.url = _.result(model, 'url');
            options.contentType = "application/json";
            options.method = "POST";
            options.data = this._selectRequestData(options.url, this.noAuth);
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        },

        _selectRequestData: function(url, noAuth) {
            var session = new Session();
            var uri = new URI(url);

            var auth = noAuth ? {} : {
                    "user-auth": {
                        username: session.get("up.session.username"),
                        password: session.get("up.session.password")
                    }
                };

            return JSON.stringify(_.extend({
                condition: JSON.parse(uri.fragment()),
            }, auth));
        }
    });

    PulsAPI.Collection = Backbone.Collection.extend({
        noAuth: false,

        asArray: function(subject) {
            if (Array.isArray(subject)) {
                return subject;
            } else if (subject) {
                return [subject];
            } else {
                return [];
            }
        },

        sync: function(method, model, options) {
            options.url = _.result(model, 'url');
            options.contentType = "application/json";
            options.method = "POST";
            options.data = this._selectRequestData(options.url, this.noAuth);
            // method to catch no user rights exception
            var error= options.error;
            var success = options.success;
            options.success = function(resp){
                if (resp && resp.message){
                    if (resp.message == "no user rights"){
                        resp.msg = "Die Funktion wird für Sie nicht unterstützt.";
                    }
                    error(resp);
                } else{
                    success(resp);
                }
            };
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        },

        _selectRequestData: function(url, noAuth) {
            var session = new Session();
            var uri = new URI(url);

            var auth = noAuth ? {} : {
                    "user-auth": {
                        username: session.get("up.session.username"),
                        password: session.get("up.session.password")
                    }
                };

            return JSON.stringify(_.extend({
                condition: JSON.parse(uri.fragment()),
            }, auth));
        }
    });

    return PulsAPI;
});