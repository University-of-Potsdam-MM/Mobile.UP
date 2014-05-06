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
      // TODO wait until authorization or throw error
      var params = _.pick(this.attributes, 'username', 'password', 'service');
      var api = this;
      $.post(this.login_url, params, function(data){
        console.log('success get_token', arguments);
        api.set(data);
        // TODO: what happens when pw is wrong?
        // debugger
        api.set('wstoken', data['token']);
        api.unset('password'); // remove password
        api.trigger('authorized');
      });
    },

    isAuthorized: function(){
      if (this.has('wstoken')) {
        // TODO if token works to fetch UserId, then we are authorized
        return true;
      } else {
        return false
      }
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
    password:'#Admin2012moodle',                // <= set this from the login page
    service:'moodle_mobile_app',
    moodlewsrestformat:'json',
  });

  MoodleApp.news_api = new (Backbone.Model.extend({
    initialize: function(){
      this.createWsFunction('webservice_get_latest_coursenews',[]);
    },
    login_url: 'https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/login/token.php',
    authorize: function(){
      // TODO wait until authorization or throw error
      var params = _.pick(this.attributes, 'username', 'password', 'service');
      var api = this;
      $.post(this.login_url, params, function(data){
        console.log('success get_token', arguments);
        api.set(data);
        // TODO: what happens when pw is wrong?
        // debugger
        api.set('wstoken', data['token']);
        api.unset('password'); // remove password
        api.trigger('authorized');
      });
    },

    isAuthorized: function(){
      if (this.has('wstoken')) {
        // TODO if token works to fetch UserId, then we are authorized
        return true;
      } else {
        return false
      }
    },

    webservice_url: 'https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/webservice/rest/server.php',

    createWsFunction: function(wsfunction, paramNames){
      var api = this;
      api[wsfunction] = function(params, callback) {
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
    password:'#Admin2012moodle',                // <= set this from the login page
    service:'webservice_coursenews',
    moodlewsrestformat:'json',
  });



  MoodleApp.api.authorize();
  MoodleApp.api.fetchUserid();



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

    // moodle_ws_params: {
    //   moodlewsrestformat:'json',
    //   wstoken: '2f8c156e50d9b595dd15e1b93b3c6bb4',
    //   wsfunction: 'core_course_get_contents',
    // },

    fetch: function(){
      console.log('fetch CourseContents', arguments);
      var collection = this;
      MoodleApp.api.core_course_get_contents({courseid: this.courseid},
        function(contents){
        // console.log('returned fetch',arguments);
        // debugger
        collection.reset(contents);
      });

      // var params = _.extend(this.moodle_ws_params,{
      //   ,
      // });

      // 

      // $.post(MoodleApp.moodle_ws_url, params, function(contents){
      //   // console.log('returned fetch',arguments);
      //   // debugger
      //   collection.reset(contents);
      // });

      return this;
    }
  })

  MoodleApp.CourseList = Backbone.Collection.extend({
    model: MoodleApp.Course,

    // moodle_ws_params: {
    //   moodlewsrestformat:'json',
    //   wstoken: '2f8c156e50d9b595dd15e1b93b3c6bb4',
    //   wsfunction:'moodle_enrol_get_users_courses',
    //   userid:'2',
    // },

    fetch: function(){
      // console.log(MoodleApp.moodle_ws_url, this.moodle_ws_params);
      var collection = this;
      MoodleApp.api.moodle_enrol_get_users_courses({}, function(content){
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


  MoodleApp.PageListView = Backbone.View.extend({
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

  MoodleApp.LoginPageView = Backbone.View.extend({
    initialize: function(){
    },
    events:{
      "click input#login": 'click_login'
    },
    template: rendertmpl('auth'),
    attributes: {"data-role":"page"},
    render: function(){
      console.log('render LoginPageView');
      this.$el.html(this.template({model:this.model}));
      $('body').append(this.$el);
      this.$el.trigger('create');
      return this;
    },
    click_login: function(ev){
      ev.preventDefault();
      this.model.set('username', this.$('input#username').val());
      this.model.set('password', this.$('input#password').val());
      this.trigger('login_attempt');
    }
  });

  MoodleApp.start = function(){
    MoodleApp.state = new Backbone.Model();

    MoodleApp.api.on('login_attempt', function(){
      console.log(arguments);
    });

    MoodleApp.authView = new MoodleApp.LoginPageView({
      id:'moodle-login-dialog',
      model: MoodleApp.api
    });

    MoodleApp.authView.render();

    MoodleApp.authView.on('login_attempt', function(){
      MoodleApp.api.authorize();
      MoodleApp.api.once('authorized', function(){
        $.mobile.navigate('#moodle');
      });
    });


    MoodleApp.courses = new MoodleApp.CourseList();

    MoodleApp.pages = new MoodleApp.PageListView({
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

    console.log('should navigate to login dialog', ! MoodleApp.api.isAuthorized());
    if (! MoodleApp.api.isAuthorized()) {
      $.mobile.navigate('#moodle-login-dialog');
    }


  };

  $(document).on("pageinit", "#moodle", MoodleApp.start);


})(jQuery);

