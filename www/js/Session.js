define([
  'jquery',
  'backbone',
  'router',
  'BaseSession'
], function($, Backbone, Router, BaseSession){

    var Session = BaseSession.extend({

        initialize : function(){
            //Check for localStorage support
            if(Storage && localStorage){
              this.supportStorage = true;
            }
        },

        get : function(key){
            if(this.supportStorage){
                var data = localStorage.getItem(key);
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
                localStorage.setItem(key, value);
            }else{
                Backbone.Model.prototype.set.call(this, key, value);
            }
            return this;
        },

        unset : function(key){
            if(this.supportStorage){
                localStorage.removeItem(key);
            }else{
                Backbone.Model.prototype.unset.call(this, key);
            }
            return this;
        },

        clear : function(){
            if(this.supportStorage){
                this.unset('up.session.authenticated');
                this.unset('up.session.username');
                this.unset('up.session.password');
            }else{
                Backbone.Model.prototype.clear(this);
            }
        },

        login : function(credentials){
            this.set('up.session.authenticated', true);
            this.set('up.session.username', credentials.username);
            this.set('up.session.password', credentials.password);

            if(this.get('redirectFrom')){
                var path = this.get('up.session.redirectFrom');
                this.unset('up.session.redirectFrom');
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
        }
  });

  return Session;

});