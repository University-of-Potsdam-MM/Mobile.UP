"use strict";

define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'Session'
], function( $, _, Backbone, utils, Session ) {

  var moodleAPI = {};

  function cors_post(url, params) {
    // console.log(url, params);
    return $.ajax( url, {
      type: "POST",
      crossDomain: true,
      data: params,
      beforeSend: function (request) {
          request.withCredentials = true;
          request.setRequestHeader("Authorization", utils.getAuthHeader());
      },
    }).fail(function(jqXHR, textStatus){
      // TODO: Handle Errors
      if(textStatus == 'timeout'){
        console.log('timeout error');
      }
      //console.log(textStatus, jqXHR);
    }).done(function(jqXHR, textStatus){
      //console.log(textStatus, jqXHR);
    });
  }


  /**
   *  BasicAPI - BackboneModel
   *  generates several moodle webservices functions
   */
  var BasicAPI = Backbone.Model.extend({

    url: 'https://api.uni-potsdam.de/endpoints/moodleAPI/webservice/rest/server.php',

    token: function() {
      return this.session.get('up.session.MoodleToken');
    },

    createWsFunction: function(wsfunction, paramNames){
      var api = this;
      api[wsfunction] = function(params) {
        paramNames = _.union(paramNames, ['wsfunction','wstoken','moodlewsrestformat']);
        var ws = {'wsfunction': wsfunction, 'wstoken': this.token()};
        var postParams = _.pick(_.extend(api.attributes, params, ws), paramNames);

        return cors_post(api.url, postParams).promise();
      }
    }
  });


  /**
   *  Moodle API Webservice - Backbone Model which extends BasicAPI
   */
  moodleAPI.api = new (BasicAPI.extend({

    initialize: function(){
      this.session = new Session();
      this.createWsFunction('moodle_webservice_get_siteinfo',[]);
      this.createWsFunction('moodle_enrol_get_users_courses',['userid']);
      this.createWsFunction('core_course_get_contents',['courseid']);
    },

    fetchUserid: function(){
      if (this.token()){
        var api = this;
        var params = {
          moodlewsrestformat:'json',
          wstoken: this.token(),
          wsfunction:'moodle_webservice_get_siteinfo',
        };

        return cors_post(this.url, params)
          .then(function(data){
            // console.log('fetchUserid', arguments);
            api.set(data);
          })
          .promise();
      }
    },
  }))({
    service:'moodle_mobile_app',
    moodlewsrestformat:'json',
  });

/*
  moodleAPI.news_api = new (BasicAPI.extend({
    initialize: function(){
      this.createWsFunction('webservice_get_latest_coursenews',[]);
    },
  }))({
    service:'webservice_coursenews',
    moodlewsrestformat:'json',
  });
*/

  return moodleAPI;
});