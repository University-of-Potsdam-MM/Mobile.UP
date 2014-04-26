/*

I couldn't get the server.js to work as a proxy with the moodle testsystem.

So in order to make cross domain requests when developing,
you have to configure your browser to allow cross domain requests.

The command line flag for Chrome is: --disable-web-security

This ish how works for me on OS X:

    $ open -a '/Applications/Google Chrome.app' --args --disable-web-security

*/

"use strict";

// TODO change this in build step
var environment = 'development';

window.MoodleApp = {};

(function($){


  // SEE HEADER COMMENT IN THIS FILE
  // if ('development' == environment) {
  //   var moodle_base_url = '/api/moodle';
  // } else {
    // TODO: replace with actual production Moodle environment
    var moodle_base_url = 'https://erdmaennchen.soft.cs.uni-potsdam.de';
  // }

  MoodleApp.moodle_ws_url = moodle_base_url + '/moodle/webservice/rest/server.php'

  MoodleApp.Course = Backbone.Model.extend({});

  MoodleApp.CourseList = Backbone.Collection.extend({
    model: MoodleApp.Course,

    moodle_ws_params: {
      moodlewsrestformat:'json',
      wstoken: '2f8c156e50d9b595dd15e1b93b3c6bb4',
      userid:'2',
      wsfunction:'moodle_enrol_get_users_courses',
    },

    fetch: function(){
      console.log(MoodleApp.moodle_ws_url, this.moodle_ws_params);
      var collection = this;
      $.post(MoodleApp.moodle_ws_url, this.moodle_ws_params, function(content){
        console.log('fetch', content);
        collection.reset(content);
      })
    }
  });

  MoodleApp.CourseListView = Backbone.View.extend({
    template: rendertmpl('moodle_course_list_view'),
    initialize: function(){
      this.collection.on('reset', this.render, this);
    },
    render: function(){
      console.log('rendering', this);
      this.$el.html(this.template({courses:this.collection.models}));
      this.$el.trigger('create')
      return this;
    }
  })


  $(document).on("pageinit", "#moodle", function () {
    // on pageinit
    MoodleApp.courses = new MoodleApp.CourseList();
    MoodleApp.courses.fetch();
    MoodleApp.listview = new MoodleApp.CourseListView({
      el: $('ul#moodle_courses'),
      collection: MoodleApp.courses
    });
  });

})(jQuery);

