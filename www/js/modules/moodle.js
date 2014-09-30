define([
        'jquery',
        'underscore',
        'backbone',
        'utils',
        'modules/moodle.api',
        'modules/moodle.utils',
        'Session'
], function( $, _, Backbone, utils, moodleAPI, moodleUtils, Session) {

  "use strict";

  window.MoodleApp = {};

  // TODO: Refactor this code with use of Backbone fetch method
  MoodleApp.Course = Backbone.Model.extend({
    fetchContents: function(){
      // Contents is a Collection
      // console.log("TODO: fetchContents: is this correct? I'm not sure about it.");
      var contents = new MoodleApp.CourseContents({courseid: this.id});
      this.set('contents', contents);
      return contents.fetch();
    },
  });

  MoodleApp.CourseContent = Backbone.Model.extend({});


  /**
   *  Backbone Collection - Moodle CourseContents
   *  for holding the whole course content
   */
  MoodleApp.CourseContents = Backbone.Collection.extend({

    model: MoodleApp.CourseContent,

    initialize: function(options){
      this.courseid = options.courseid;
    },

    fetch: function(){
      // console.log('fetch CourseContents', arguments);
      var collection = this;
      moodleAPI.api.core_course_get_contents({courseid: this.courseid})
        .then(function(contents){
          var token = moodleAPI.api.token();
          return moodleUtils.fixPluginfileForCourseContents(token, contents);
        })
        .done(function(contents){
          collection.reset(contents);
        });
      return this;
    }
  });

  /**
   *  Backbone Collection - Moodle CourseList
   *  displays all courses in the starting list
   */
  MoodleApp.CourseList = Backbone.Collection.extend({

    model: MoodleApp.Course,

    comparator: 'fullname',

    fetch: function(){
      var collection = this;
      moodleAPI.api.moodle_enrol_get_users_courses()
        .done(function(content){
          collection.reset(content);
        });
      return this;
    }
  });

  /**
   *  Backbone Collection - Moodle Newslist
   *  for displaying all news (still not productive)
   */
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

    initialize: function(options){
        this.courses = options.courses;
        this.news = options.news;
        this.template = utils.rendertmpl('moodle_course_list_view');
        this.courses.on('reset', this.render, this);
        //this.news.on('reset', this.render, this);
    },

    render: function(){
        this.$el.html(this.template({courses:this.courses.models}));
        this.$el.trigger('create')
        return this;
    }
  });


  /**
   *  Backbone View - CourseView
   *  view for single courses
   */
  MoodleApp.CourseView = Backbone.View.extend({



    initialize: function(options){
      this.news = options.news;
      this.template = utils.rendertmpl('moodle_course_contents_page');

      this.model.on('change', this.render, this);
      this.collection.on('change', this.render, this);
      this.collection.on('reset', this.render, this);
      //this.news.on('change', this.render, this);
    },

    render: function(){
      // console.log('render CourseContentsPage', this.el, this.model, this.collection);
      var data = {
        course:this.model,
        contents: this.collection,
        //news: this.news.get(this.model.id)
      };
      this.$el.html(this.template(data));
      this.$el.trigger('create');
      return this;
    }
  });


  /**
   * Backbone View - MoodlePage
   * Startview for Moodle
   */
  var MoodlePageView = Backbone.View.extend({
    attributes: {"id": "moodle"},
    model: Session,

    events: {
        'click .moodle-course': 'selectCourse',
        'click .backbutton': 'back'
    },

    initialize: function(){
        this.template = utils.rendertmpl('moodle');
        this.listenToOnce(this, "authorize", this.authorize);
        this.listenToOnce(this, "fetchContent", this.fetchContent);
    },

    authorize: function(){
      // Moodle API isn't fetching so manuell adding of loading spinner
      this.LoadingView = new utils.LoadingView({el: this.$("#loadingSpinner")});
      this.LoadingView.spinnerOn();

      //moodleAPI.news_api.set(credentials);
      var that = this;
      $.when(
          moodleAPI.api.fetchUserid()
          //moodleAPI.news_api.authorize()
        ).done(function(){
            // moodleAPI.api should be authorized and has userId, moodleAPI.news_api should be authorized
            that.trigger("fetchContent");
        }).fail(function(error){
            var errorPage = new utils.ErrorView({el: '#courselist', msg: 'Fehler beim Abruf der Kurse. Bitte loggen Sie sich erneut ein.', module: 'moodle', err: error});
        });
    },

    fetchContent: function(){
        var that = this;
        // fetch all necessary information
        MoodleApp.courses = new MoodleApp.CourseList();
        //MoodleApp.news = new MoodleApp.NewsList();
        //$.when(MoodleApp.courses.fetch(), MoodleApp.news.fetch())

        $.when(MoodleApp.courses.fetch())
         .then(function(){

            MoodleApp.listview = new MoodleApp.CourseListView({
                el: that.$('ul#moodle_courses'),
                courses: MoodleApp.courses
                //news: MoodleApp.news
            });

            MoodleApp.courses.on('add', function(course){
                // console.log('add', arguments);
                course.fetchContents();
            });

            MoodleApp.courses.on('reset', function(collection){
                // console.log('reset', arguments);
                collection.each(function(course){
                    // console.log('fetch contents for course', course);
                    course.fetchContents();
                });
            });
            that.LoadingView.spinnerOff();
         });
    },

    render: function(){
        this.$el.html(this.template({}));
        this.courselist = this.$el.find('courselist');
        $(this.el).trigger("create");
        this.trigger("authorize");
        return this;
    },

    selectCourse: function(ev) {
        ev.preventDefault();
        // get selected course
        var courseid = $(ev.target).closest('li').attr('courseid');
        var course = MoodleApp.courses.get(courseid);

        // render course
        var courseView = new MoodleApp.CourseView({
            model: course,
            collection: course.get('contents') || course.fetchContents(),
            news: MoodleApp.news,
        });

        this.$el.html(courseView.render().el);
        this.$el.trigger('create');
        return this;
    },

    back: function(ev){
        ev.preventDefault();

        this.render();
        $('ul#moodle_courses').html(MoodleApp.listview.render().el)
        this.$el.trigger('create');
        return this;
    }
  });

  return MoodlePageView;

});