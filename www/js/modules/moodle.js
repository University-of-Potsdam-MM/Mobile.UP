/*
So in order to make cross domain requests when developing,
you have to configure your browser to allow cross domain requests.

The command line flag for Chrome is: --disable-web-security

This is how it works for me on OS X:

    $ open -a '/Applications/Google Chrome.app' --args --disable-web-security

*/

define([
        'jquery',
        'underscore',
        'backbone',
        'utils',
        'modules/moodle.api',
        'Session'
], function( $, _, Backbone, utils, moodleAPI, Session) {

  "use strict";

  window.MoodleApp = {};

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

    model: MoodleApp.CourseContent,

    initialize: function(options){
      // console.log('initialize', arguments);
      this.courseid = options.courseid;
    },

    fetch: function(){
      console.log('fetch CourseContents', arguments);
      var collection = this;
      moodleAPI.api.core_course_get_contents({courseid: this.courseid})
        .done(function(contents){
          collection.reset(contents);
        });

      return this;
    }
  })

  MoodleApp.CourseList = Backbone.Collection.extend({

    model: MoodleApp.Course,

    fetch: function(){
      var collection = this;
      moodleAPI.api.moodle_enrol_get_users_courses()
        .done(function(content){
          console.log('fetch', content);
          collection.reset(content);
        });
      return this;
    }
  });



  MoodleApp.NewsList = Backbone.Collection.extend({
    fetch: function() {
      var collection = this;
      moodleAPI.news_api.webservice_get_latest_coursenews()
        .done(function(news){
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

  /**
   * Backbone View - CourseList
   */

  MoodleApp.CourseListView = Backbone.View.extend({

    template: utils.rendertmpl('moodle_course_list_view'),

    initialize: function(){
        this.collection.on('reset', this.render, this);
    },

    render: function(){
        this.$el.html(this.template({courses:this.collection.models}));
        this.$el.trigger('create')
        return this;
    }
  });


  MoodleApp.CourseContentsPage = Backbone.View.extend({
    template: utils.rendertmpl('moodle_course_contents_page'),
    initialize: function(options){
      this.news = options.news;

      this.model.on('change', this.render, this);
      this.collection.on('change', this.render, this);
      this.collection.on('reset', this.render, this);
      this.news.on('change', this.render, this);
    },
    events: {
      "click .backbutton": "back"
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
    },
    back: function(ev){
      ev.preventDefault();
      $.mobile.changePage($('#moodle'));
    }
  });


  MoodleApp.PageListView = Backbone.View.extend({

    initialize: function(options){
        this.news = options.news;
        _.bindAll(this, 'renderOne');
    },

    events: {
        'click li': 'selectCourse'
    },

    renderOne: function(course){
      var page = new MoodleApp.CourseContentsPage({
        id: 'moodle-course-content-' + course.id,
        attributes: {"data-role":"page", "data-dom-cache":"true"},
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

    selectCourse: function(ev) {
        console.log('course selected');
      ev.preventDefault();
      var pageid = $(ev.target).closest('li').attr('pageid');
      // ????
      $.mobile.changePage($('#' + pageid));
    }

  });


  var MoodlePageView = Backbone.View.extend({

    model: Session,

    template: utils.rendertmpl('moodle'),

    attributes: {"id": "moodle", "data-dom-cache": "true"},

    initialize: function(){
        var that = this;

        // get cred and populate Moodle Session

        var credentials = {username: this.model.get('username'), password: this.model.get('password')};
        console.log(credentials);

        moodleAPI.api.set(credentials);
        moodleAPI.news_api.set(credentials);

        $.when(
            moodleAPI.api.authorizeAndGetUserId(),
            moodleAPI.news_api.authorize()
        ).done(function(){
            // moodleAPI.api should be authorized and has userId, moodleAPI.news_api should be authorized
            console.log('authorization complete');
            that.fetchContent();
        }).fail(function(){
            // error handling

        });
    },

    fetchContent: function(){
        var that = this;
        // fetch all necessary information
        MoodleApp.courses = new MoodleApp.CourseList();
        MoodleApp.news = new MoodleApp.NewsList();

        $.when(MoodleApp.courses.fetch(), MoodleApp.news.fetch())
         .then(function(){
            console.log('information fetched');
            MoodleApp.listview = new MoodleApp.CourseListView({
                el: that.$('ul#moodle_courses'),
                collection: MoodleApp.courses,
                news: MoodleApp.news
            });

            MoodleApp.pages = new MoodleApp.PageListView({
                el: $('#pagecontainer'),
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

            MoodleApp.listview.on('select', function(course){
                course.fetchContents();
                MoodleApp.state.set('selectedCourse', course);
            });

         });
    },

    render: function(){
        console.log('moodle render');
        this.$el.html(this.template({}));
        this.courselist = this.$el.find('courselist');

        $(this.el).trigger("create");
        return this;
    }
  });

  return MoodlePageView;

});