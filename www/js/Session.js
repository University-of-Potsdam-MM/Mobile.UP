define([
  'jquery',
  'backbone',
  'uri/URI'
], function($, Backbone, Router, URI){
	
	var CacheManager = Backbone.Model.extend({
		
		privateHost: "api.uni-potsdam.de",
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

    var Session = Backbone.Model.extend({

        suburl: 'https://api.uni-potsdam.de/endpoints/moodleAPI/login/token.php',

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
        },

        generateLoginURL: function(credentials){
            this.url = this.suburl;
            // prepare Moodle Token URL
            this.url +='?username='+encodeURIComponent(credentials.username);
            this.url +='&password='+encodeURIComponent(credentials.password);
            this.url +='&service=moodle_mobile_app&moodlewsrestformat=json';
        },
        
        clearPrivateCache: function() {
        	new CacheManager().clearPrivateCache();
    	}
  });

  return Session;
});