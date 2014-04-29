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
  var moodle_base_url = 'https://erdmaennchen.soft.cs.uni-potsdam.de';

  MoodleApp.api = new (Backbone.Model.extend({
    initialize: function(){
      this.createWsFunction('moodle_webservice_get_siteinfo',[]);
      this.createWsFunction('moodle_enrol_get_users_courses',['userid']);
      this.createWsFunction('core_course_get_contents',['courseid']);
    },
    login_url: moodle_base_url + '/moodle/login/token.php',
    authorize: function(){
      var params = _.pick(this.attributes, 'username', 'password', 'service');
      var api = this;
      $.post(this.login_url, params, function(data){
        console.log('success get_token', arguments);
        api.set(data);
        api.unset('password'); // remove password
      });
    },

    webservice_url: moodle_base_url + '/moodle/webservice/rest/server.php',
    fetchUserid: function(){
      var api = this;
      var params = {
        moodlewsrestformat:'json',
        wstoken: this.get('token'),
        wsfunction:'moodle_webservice_get_siteinfo',
      };
      $.post(this.webservice_url, params, function(data){
        console.log('fetchUserid', arguments);
        api.set(data);
      });
    },

    createWsFunction: function(wsfunction, paramNames){
      var api = this;
      api[wsfunction] = function(params, callback) {
        debugger
        paramNames = _.union(paramNames, ['wsfunction','wstoken','moodlewsrestformat']);
        var ws = {'wsfunction': wsfunction, 'wstoken': api.get('token')};
        var postParams = _.pick(_.extend(api.attributes, params, ws), paramNames);
        $.post(api.webservice_url, postParams, callback);
      }
    },

    callWsFunction: function(functionName, params, callback){},
  }))({
    realm:'Moodle',             // => display this in the user login page
    username:'admin',           // <= set this from the login page
    password:'',                // <= set this from the login page
    service:'moodle_mobile_app',
    moodlewsrestformat:'json',
  });


  // MoodleApp.api.authorize();
  // MoodleApp.api.fetchUserid();



  MoodleApp.moodle_ws_url = moodle_base_url + '/moodle/webservice/rest/server.php'

  MoodleApp.Course = Backbone.Model.extend({
    fetchContents: function(){
      var contents = new MoodleApp.CourseContents({
        courseid: this.id
      }).fetch();
      this.set('contents', contents);
      return this.get('contents');
    },
  });

  MoodleApp.CourseContent = Backbone.Model.extend({});

  MoodleApp.CourseContents = Backbone.Collection.extend({
    initialize: function(options){
      // console.log('initialize', arguments);
      this.courseid = options.courseid;
    },

    model: MoodleApp.CourseContent,

    moodle_ws_params: {
      moodlewsrestformat:'json',
      wstoken: '2f8c156e50d9b595dd15e1b93b3c6bb4',
      wsfunction: 'core_course_get_contents',
    },

    fetch: function(){
      console.log('fetch CourseContents', arguments);
      var params = _.extend(this.moodle_ws_params,{
        courseid: this.courseid,
      });

      var collection = this;

      $.post(MoodleApp.moodle_ws_url, params, function(contents){
        // console.log('returned fetch',arguments);
        // debugger
        collection.reset(contents);
      });

      return collection;
    }
  })

  MoodleApp.CourseList = Backbone.Collection.extend({
    model: MoodleApp.Course,

    moodle_ws_params: {
      moodlewsrestformat:'json',
      wstoken: '2f8c156e50d9b595dd15e1b93b3c6bb4',
      wsfunction:'moodle_enrol_get_users_courses',
      userid:'2',
    },

    fetch: function(){
      // console.log(MoodleApp.moodle_ws_url, this.moodle_ws_params);
      var collection = this;
      $.post(MoodleApp.moodle_ws_url, this.moodle_ws_params, function(content){
        // console.log('fetch', content);
        collection.reset(content);
      });
      return this;
    }
  });



  MoodleApp.CourseListView = Backbone.View.extend({
    template: rendertmpl('moodle_course_list_view'),
    initialize: function(){
      this.collection.on('reset', this.render, this);
    },
    render: function(){
      // console.log('rendering', this);
      this.$el.html(this.template({courses:this.collection.models}));
      this.$el.trigger('create')
      return this;
    }
  })

  MoodleApp.CourseContentsPage = Backbone.View.extend({
    template: rendertmpl('moodle_course_contents_page'),
    initialize: function(){
      this.model.on('change', this.render, this);
      this.collection.on('change', this.render, this);
      this.collection.on('reset', this.render, this);
      // console.log('init', this);
    },
    render: function(){
      console.log('render CourseContentsPage', this.el, this.model, this.collection);
      this.$el.html(this.template({course:this.model, contents: this.collection}));
      this.$el.trigger('create');
      return this;
    }
  })


  MoodleApp.PagesView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, 'renderOne');
    },
    renderOne: function(course) {
      var page = new MoodleApp.CourseContentsPage({
        id: 'moodle-course-content-' + course.id,
        attributes: {"data-role":"page"},
        model: course,
        collection: course.get('contents') || course.fetchContents(),
      });
      this.$el.append(page.render().el);
    },
    render: function(){
      console.log('rendering CourseContents', this);
      this.collection.each(this.renderOne);
      console.log('done rendering CourseContents', this.el);
      return this;
    },
  })



  MoodleApp.start = function(){
    MoodleApp.state = new Backbone.Model();

    // on pageinit
    MoodleApp.courses = new MoodleApp.CourseList();

    MoodleApp.pages = new MoodleApp.PagesView({
      el: $('body'),
      collection: MoodleApp.courses
    });

    MoodleApp.courses.on('add', function(course){
      // console.log('add', arguments);
      course.fetchContents();
    });
    MoodleApp.courses.on('reset', function(collection){
      // console.log('reset', arguments);
      collection.each(function(course){
        console.log('fetch contents for course', course);
        course.fetchContents();
      });

      MoodleApp.pages.render();
    });
    MoodleApp.courses.fetch();
    MoodleApp.listview = new MoodleApp.CourseListView({
      el: $('ul#moodle_courses'),
      collection: MoodleApp.courses,
      // events: {
      //   "click li" : function(ev){
      //     // console.log('click', arguments);
      //     var courseid = $(ev.target).closest('li.moodle-course').attr('id');
      //     // console.log('courseid', courseid);
      //     var selectedCourse = this.collection.get(courseid);
      //     this.trigger('select', selectedCourse)
      //   }
      // }
    });

    MoodleApp.listview.on('select', function(course){
      course.fetchContents();
      MoodleApp.state.set('selectedCourse', course);
    });

    MoodleApp.state.on('change:selectedCourse', function(){
      console.log('change selectedCourse', arguments);
    });

  };

  $(document).on("pageinit", "#moodle", MoodleApp.start);


})(jQuery);

