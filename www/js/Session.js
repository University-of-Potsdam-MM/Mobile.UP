define([
  'jquery',
  'backbone',
  'router',
  'BaseSession'
], function($, Backbone, Router, BaseSession){

    var Session = BaseSession.extend({

        initialize : function(){
            console.log('Session initialized');
            //Check for sessionStorage support
            if(Storage && sessionStorage){
              this.supportStorage = true;
            }
        },

        get : function(key){
            if(this.supportStorage){
                var data = sessionStorage.getItem(key);
                if(data && data[0] === '{'){
                    return JSON.parse(data);
                }else{
                    return data;
                }
            }else{
                return Backbone.Model.prototype.get.call(this, key);
            }
        },

        set : function(key, value){
            if(this.supportStorage){
                sessionStorage.setItem(key, value);
            }else{
                Backbone.Model.prototype.set.call(this, key, value);
            }
            return this;
        },

        unset : function(key){
            if(this.supportStorage){
                sessionStorage.removeItem(key);
            }else{
                Backbone.Model.prototype.unset.call(this, key);
            }
            return this;
        },

        clear : function(){
            if(this.supportStorage){
                sessionStorage.clear();
            }else{
                Backbone.Model.prototype.clear(this);
            }
        },

        login : function(credentials){
            this.set('authenticated', true);
            this.set('username', credentials.username);
            this.set('password', credentials.password);

            if(this.get('redirectFrom')){
                var path = this.get('redirectFrom');
                this.unset('redirectFrom');
                Backbone.history.navigate(path, { trigger : true });
            }else{
                Backbone.history.navigate('', { trigger : true });
            }
            console.log('logged in');
        },

        // delete credenials
        logout : function(callback){
            this.clear();
            console.log('logged out');
        },

        getAuth : function(callback){
            var that = this;
            var Session = this.fetch();

            Session.done(function(response){
                that.set('authenticated', true);
                that.set('user', JSON.stringify(response.user));
            });

            Session.fail(function(response){
                response = JSON.parse(response.responseText);
                that.clear();
                csrf = response.csrf !== csrf ? response.csrf : csrf;
                that.initialize();
            });

            Session.always(callback);
        }
  });

  return Session;

});