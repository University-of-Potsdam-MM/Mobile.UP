/*

I couldn't get the server.js to work as a proxy with the moodle testsystem.

So in order to make cross domain requests when developing,
you have to configure your browser to allow cross domain requests.

The command line flag for Chrome is: --disable-web-security

This ish how works for me on OS X:

    $ open -a '/Applications/Google Chrome.app' --args --disable-web-security

*/

"use strict";

define(['jquery', 'underscore', 'backbone', 'helper', 'machina'],
  function( $, _, Backbone, helper, machina ) {

  // TODO change this in build step
  var environment = 'development';

  window.MoodleApp = {};

  MoodleApp.fsm = new machina.Fsm({
    logout: function(){
      console.log('logging out');
      MoodleApp.api.unset('wstoken');
      MoodleApp.news_api.unset('wstoken');
      this.transition('loginform');
    },
    error: function(data){
      // TODO doesn't work yet
      var errorcode = _.isString(data) ? data : data.errorcode;
      this.transition('error');
    },
    states: {
      uninitialized: {
        // this state is here so the we don't get errors when MoodleApp.api isn't defined yet
        initialize: function( payload ) {
          console.log('transition to initialized');
          this.transition('initialized');
        },
      },
      initialized:{
        _onEnter: function() {
          // if there is a token, go to authorized
          if (MoodleApp.api.isAuthorized() && MoodleApp.news_api.isAuthorized()) {
            console.log('schon authorized');
            this.transition('authorized');
          } else {
            console.log('noch nicht authorized');
            this.transition('loginform');
          }
        },
      },
      loginform:{
        _onEnter: function(){
          // TODO: clear tokens and credentials from api

          // display login form
          console.log('display login dialog');
          $.mobile.navigate('#moodle-login-dialog');
        },
        authorize: function(credentials){
          // if username / password are set go to authorizing
          console.log('authorize', credentials);
          if ( ! (_.isEmpty(credentials.username) || _.isEmpty(credentials.password)) ) {
            // debugger
            MoodleApp.api.set(credentials);
            MoodleApp.news_api.set(credentials);
            this.transition('authorizing', credentials); // it doesn't seem like credentials are passed at all
          }
        }
      },
      authorizing:{
        _onEnter: function() {
          // display spinner
          // ask MoodleApp.api and MoodleApp.news_api for token + UID (use async or similar)
          console.log('authorizing: _onEnter', arguments);
          var fsm = this;
          $.when(
            MoodleApp.api.authorizeAndGetUserId(),
            MoodleApp.news_api.authorize()
          ).done(function(){
            // MoodleApp.api should be authorized and has userId, MoodleApp.news_api should be authorized
            console.log('authorization complete');
            fsm.transition('authorized');
          });
        },
        success: function() {
          // success = beide APIs sind authorized
          // save token
          // go to authorized
          this.transition('authorized');
        },
        failure: function() {
          // go to loginform
          // display message
        },
        _onExit: function() {
          // remove spinner
        }

      },
      authorized: {
        _onEnter: function() {
          // display main view
          $.mobile.navigate('#moodle');
          MoodleApp.courses.fetch();
          MoodleApp.news.fetch();
        },
        not_authorized: {
          // called when there is a 'you are not authorized msg from the server'
          // should reset authorization and go to uninitialized state
        }
      }
    },
  });



  MoodleApp.api = new (Backbone.Model.extend({
    initialize: function(){
      this.createWsFunction('moodle_webservice_get_siteinfo',[]);
      this.createWsFunction('moodle_enrol_get_users_courses',['userid']);
      this.createWsFunction('core_course_get_contents',['courseid']);
    },


    authorizeAndGetUserId: function(){
      var api = this;
      return api.authorize().then(function(){
        if (api.isAuthorized()) {
          return api.fetchUserid();
        };
      });
    },

    login_url: 'https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/login/token.php',
    authorize: function(){
      // TODO wait until authorization or throw error
      var params = _.pick(this.attributes, 'username', 'password', 'service');
      var api = this;
      return $.post(this.login_url, params, function(data){
        console.log('success get_token', arguments);
        api.set(data);
        // TODO: what happens when pw is wrong?
        // debugger
        api.set('wstoken', data['token']);
        api.unset('password'); // remove password
        api.trigger('authorized');
      }).promise();
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
    fetchUserid: function(){
      var api = this;
      var params = {
        moodlewsrestformat:'json',
        wstoken: this.get('token'),
        wsfunction:'moodle_webservice_get_siteinfo',
      };
      return $.post(this.webservice_url, params, function(data){
        console.log('fetchUserid', arguments);
        api.set(data);
      }).promise();
    },

    createWsFunction: function(wsfunction, paramNames){
      var api = this;
      api[wsfunction] = function(params) {
        paramNames = _.union(paramNames, ['wsfunction','wstoken','moodlewsrestformat']);
        var ws = {'wsfunction': wsfunction, 'wstoken': api.get('token')};
        var postParams = _.pick(_.extend(api.attributes, params, ws), paramNames);

        return $.post(api.webservice_url, postParams).promise();
      }
    },
  }))({
    realm:'Moodle',             // => display this in the user login page
    // username: undefined,     // <= set this from the login page
    // password: undefined,     // <= set this from the login page
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
      var news_api = this;
      return $.post(this.login_url, params, function(data){
        console.log('news_api success get_token', arguments);
        news_api.set(data);
        // TODO: what happens when pw is wrong?
        // debugger
        news_api.set('wstoken', data['token']);
        news_api.unset('password'); // remove password
        news_api.trigger('authorized');
      }).promise();
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
      api[wsfunction] = function(params) {
        paramNames = _.union(paramNames, ['wsfunction','wstoken','moodlewsrestformat']);
        var ws = {'wsfunction': wsfunction, 'wstoken': api.get('token')};
        var postParams = _.pick(_.extend(api.attributes, params, ws), paramNames);
        return $.post(api.webservice_url, postParams).promise();
      }
    },
  }))({
    realm:'Moodle',             // => display this in the user login page
    // username: undefined,     // <= set this from the login page
    // password: undefined,     // <= set this from the login page
    service:'webservice_coursenews',
    moodlewsrestformat:'json',
  });


  MoodleApp.Course = Backbone.Model.extend({
    fetchContents: function(){
      // Contents is a Collection
      console.log("TODO: fetchContents: is this correct? I'm not sure about it.");
      var contents = new MoodleApp.CourseContents({courseid: this.id});
      this.set('contents', contents);
      return contents.fetch();
    },
  });

  MoodleApp.CourseContent = Backbone.Model.extend({});

  MoodleApp.CourseContents = Backbone.Collection.extend({
    initialize: function(options){
      // console.log('initialize', arguments);
      this.courseid = options.courseid;
    },

    model: MoodleApp.CourseContent,

    fetch: function(){
      console.log('fetch CourseContents', arguments);
      var collection = this;
      MoodleApp.api.core_course_get_contents({courseid: this.courseid}).done(
        function(contents){
          collection.reset(contents);
      });

      return this;
    }
  })

  MoodleApp.CourseList = Backbone.Collection.extend({
    model: MoodleApp.Course,

    fetch: function(){
      // console.log(MoodleApp.moodle_ws_url, this.moodle_ws_params);
      var collection = this;
      MoodleApp.api.moodle_enrol_get_users_courses().done(function(content){
          // console.log('fetch', content);
          collection.reset(content);
        });
      return this;
    }
  });



  MoodleApp.NewsList = Backbone.Collection.extend({
    fetch: function() {
      var collection = this;
      MoodleApp.news_api.webservice_get_latest_coursenews().done(function(news){
        console.log('newslist fetch returns', news);
        var courses = _.map(news.courses, function(course){
          course.id = course.courseid;

          var realnews = _.reject(course.coursenews, function(cn){
            // remove all where this condition holds
            return ((cn.modulename == null) && (cn.news == 'no news'));
          });
          course.coursenews = new Backbone.Collection(realnews);

          return new Backbone.Model(course);
        })
        collection.reset(courses);
      });
      return this;
    },

  });

  MoodleApp.CourseListView = Backbone.View.extend({
    template: helper.rendertmpl('moodle_course_list_view'),
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
    template: helper.rendertmpl('moodle_course_contents_page'),
    initialize: function(options){
      this.news = options.news;

      this.model.on('change', this.render, this);
      this.collection.on('change', this.render, this);
      this.collection.on('reset', this.render, this);
      this.news.on('change', this.render, this);
    },
    render: function(){
      console.log('render CourseContentsPage', this.el, this.model, this.collection);
      var data = {
        course:this.model,
        contents: this.collection,
        news: this.news.get(this.model.id)
      };
      this.$el.html(this.template(data));
      this.$el.trigger('create');
      return this;
    }
  })


  MoodleApp.PageListView = Backbone.View.extend({
    initialize: function(options){
      this.news = options.news;
      _.bindAll(this, 'renderOne');
    },
    renderOne: function(course) {
      var page = new MoodleApp.CourseContentsPage({
        id: 'moodle-course-content-' + course.id,
        attributes: {"data-role":"page"},
        model: course,
        collection: course.get('contents') || course.fetchContents(),
        news: this.news,
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
    template: helper.rendertmpl('auth'),
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
      this.trigger('login_attempt', this.model.attributes);
    }
  });

  MoodleApp.start = function(){
    MoodleApp.state = new Backbone.Model();

    MoodleApp.authView = new MoodleApp.LoginPageView({
      id:'moodle-login-dialog',
      model: new Backbone.Model()
    });

    MoodleApp.authView.render();

    MoodleApp.authView.on('login_attempt', function(credentials){
      MoodleApp.fsm.handle('authorize', credentials);
    });


    MoodleApp.courses = new MoodleApp.CourseList();
    MoodleApp.news = new MoodleApp.NewsList()

    MoodleApp.pages = new MoodleApp.PageListView({
      el: $('body'),
      collection: MoodleApp.courses,
      news: MoodleApp.news,
    });

    MoodleApp.courses.on('add', function(course){
      console.log('add', arguments);
      course.fetchContents();
    });
    MoodleApp.courses.on('reset', function(collection){
      console.log('reset', arguments);
      collection.each(function(course){
        console.log('fetch contents for course', course);
        course.fetchContents();
      });

      MoodleApp.pages.render();
    });

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
  $(document).on("pagechange", function(event, options){
    console.log('pagechange', arguments);
    console.log('pagechange', options.toPage);

    MoodleApp.fsm.handle('initialize');
    // MoodleApp.fsm.logout();
  });


  return MoodleApp;

});

