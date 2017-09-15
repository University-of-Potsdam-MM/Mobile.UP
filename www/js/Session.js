define([
  'jquery',
  'backbone',
  'uri/URI'
], function($, Backbone, URI){

    var CacheManager = Backbone.Model.extend({

        privateHost: "apiup.uni-potsdam.de",
        privateEndpoints: ["/endpoints/pulsAPI", "/endpoints/moodleAPI"],

        /**
         * Removes all cache entries that are based on user data.
         */
        clearPrivateCache: function() {
            var privateKeys = _.filter(_.keys(Backbone.fetchCache._cache), this.isPrivate, this);
            for (key in privateKeys) {
                Backbone.fetchCache.clearItem(privateKeys[key]);
            }
        },

        isPrivate: function(value) {
            var uri = new URI(value);
            return uri.host() === this.privateHost && this.privateEndpoints.indexOf(uri.path() != -1);
        }
    });

    var LocalStorageModel = Backbone.Model.extend({

        initialize: function(){
            //Check for localStorage support
            if(Storage && localStorage){
                this.supportStorage = true;
            }
        },

        get: function(key){
            if(this.supportStorage){
                var data = (localStorage.getItem(key) === null) ? null : localStorage.getItem(key);
                if(data && data[0] === '{'){
                    return JSON.parse(data);
                }else{
                    return data;
                }
            }else{
                return Backbone.Model.prototype.get.call(this, key);
            }
        },

        set: function(key, value){
            if(this.supportStorage){
                localStorage.setItem(key, value);
            }else{
                Backbone.Model.prototype.set.call(this, key, value);
            }
            return this;
        },

        unset: function(key){
            if(this.supportStorage){
                localStorage.removeItem(key);
            }else{
                Backbone.Model.prototype.unset.call(this, key);
            }
            return this;
        }
    });

    var Session = LocalStorageModel.extend({

        suburl: 'https://apiup.uni-potsdam.de/endpoints/moodleAPI/login/token.php',

        setLogin: function(credentials) {
            this.set('up.session.authenticated', credentials.authenticated);
            this.set('up.session.username', credentials.username);
            this.set('up.session.password', credentials.password);
            this.set('up.session.MoodleToken', credentials.token);
        },

        unsetLogin: function() {
            this.unset('up.session.authenticated');
            this.unset('up.session.username');
            this.unset('up.session.password');
            this.unset('up.session.MoodleToken');
        },

        generateLoginURL: function(credentials){
            this.url = this.suburl;
            // prepare Moodle Token URL
            this.url +='?username='+encodeURIComponent(credentials.username);
            this.url +='&password='+encodeURIComponent(credentials.password);
            this.url +='&service=moodle_mobile_app&moodlewsrestformat=json';
        },

        parse: function(response) {
            return response;
        },

        clearPrivateCache: function() {
            new CacheManager().clearPrivateCache();
        }
  });

  return Session;
});