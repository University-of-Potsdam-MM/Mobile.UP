define([
  'jquery',
  'backbone',
  'router'
], function($, Backbone, Router){

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
        }
  });

  return Session;

});