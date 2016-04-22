define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'uri/URI'
], function($, _, Backbone, utils, URI){
    Backbone.fetchCache.enabled = false;

    /**
     * Represents a lecture course (Kurs) or lecture category (Kategorie / Überschrift). You can distinguish between these two by checking the boolean properties isCategory and isCourse.
     *
     * If it's a course the following properties are set
     * - isCourse
     * - suburl
     * - name
     * - url
     * - type
     *
     * If it's a category the following properties are set
     * - isCategory
     * - suburl
     * - name
     * - url
     * - level
     */
    var VvzItem = Backbone.Model.extend({
        defaults: {
            "name": "Vorlesungsverzeichnis"
        },

        initialize: function() {
            this.set("suburl", this.createSubUrl());
        },

        createSubUrl: function() {
            var result = "https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/";
            if (!this.has("headerId") && !this.has("courseId")) {
                // No id known -> we are at the root
                result += "getLectureScheduleRoot";
            } else if (this.has("headerId")) {
                // There are children -> we have to dig deeper
                result += "getLectureScheduleSubTree#" + this.get("headerId");
            } else if (this.has("courseId")) {
                // There is a course id -> course details next
                result += "getCourseData#" + this.get("courseId");
            }
            return result;
        },

        createCourseUrl: function(url) {
            var headerId = new URI(url).fragment();
            var result = "https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/";
            result += "getLectureScheduleCourses#" + headerId;
            return result;
        },

        ensureSubmodelLoaded: function(createAction) {
            var submodel = this.get("submodel");
            if (!submodel) {
                // Create model
                submodel = new VvzCourseContent;
                submodel.url = this.get("suburl");
                this.set("submodel", submodel);

                createAction(submodel);
            }
        }
    });

    /**
     * Holds all details for a lecture course. The following properties are set
     * - groups (array)
     *   - name
     *   - dates (array)
     *     - weekday
     *     - time
     *     - rhythm
     *     - timespan
     *     - room
     *     - lecturer
     *
     */
    var VvzCourseContent = Backbone.Model.extend({

        parse: function(response) {
            // Events have to be grouped by groupId to know which dates belong together
            var groups = response.courseData.course[0].events.event;
            var groupedEvents = _.groupBy(this.ensureArray(groups), "groupId");

            var joinLecturers = function(lecturers) {
                return _.map(lecturers, function (l) {
                    return (l.lecturerTitle ? l.lecturerTitle + " " : "") + l.lecturerLastname;
                }).join(", ");
            };

            return {
                groups: _.map(groupedEvents, function(dates) {
                    return {
                        name: dates[0].group,
                        dates: _.map(dates, function(date) {
                            return {
                                weekday: date.daySC,
                                time: date.startTime + " bis " + date.endTime,
                                rhythm: date.rhythm,
                                timespan: date.startDate + " bis " + date.endDate,
                                room: (date.roomSc || "").replace(/_/g, "."),
                                lecturer: joinLecturers(this.ensureArray(date.lecturers.lecturer))
                            };
                        }, this)
                    }
                }, this)
            };
        },

        ensureArray: function(param) {
            if (!param) {
                return param;
            } else if (Array.isArray(param)) {
                return param;
            } else {
                return [param];
            }
        },

        sync: function(method, model, options) {
            options.url = _.result(model, 'url');
            options.contentType = "application/json";
            options.method = "POST";
            options.data = this._selectRequestData(options.url);
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        },

        _selectRequestData: function(url) {
            var uri = new URI(url);
            var data = {condition: {}};
            data.condition.courseId = uri.fragment();
            return JSON.stringify(data);
        }
    });

    /**
     * Holds all courses and categories for a given url. The current url can be changed by calling CurrentVvz.load(vvzHistory) with the first entry in vvzHistory containing the new url.
     */
    var CurrentVvz = Backbone.Model.extend({

        initialize: function() {
            this.items = new VvzCollection();
        },

        load: function(vvzHistory) {
            // We can't detect whether we have a category or course so we try loading a category first. If that fails we try loading a course
            var reloadOnEmpty = _.bind(function(collection, response, options) {
                if (collection.isEmpty()) {
                    // Second try: loading a course
                    var model = vvzHistory.first();
                    model.set("suburl", VvzItem.prototype.createCourseUrl(model.get("suburl")));
                    this._loadOnce(vvzHistory);
                }
            }, this);

            // First try: loading a category
            this._loadOnce(vvzHistory, reloadOnEmpty);
        },

        _loadOnce: function(vvzHistory, success) {
            this.items.url = vvzHistory.first().get("suburl");
            this.items.reset();
            this.items.fetch(utils.cacheDefaults({
                reset: true,
                success: success
            }));
        }
    });

    var VvzCollection = Backbone.Collection.extend({
        model: VvzItem,

        parse: function(response) {
            if (response.lectureScheduleRoot) {
                var models = response.lectureScheduleRoot.rootNode.childNodes.childNode;
                return _.chain(this.ensureArray(models))
                        .reject(function(model) { return model === ""; })
                        .map(function(model) {
                            return {
                                name: model.headerName,
                                headerId: model.headerId,
                                isCategory: true
                            };
                        })
                        .value();
            } else if (response.lectureScheduleSubTree) {
                var models = response.lectureScheduleSubTree.currentNode.childNodes.childNode;
                return _.chain(this.ensureArray(models))
                        .reject(function(model) { return model === ""; })
                        .map(function(model) {
                            return {
                                name: model.headerName,
                                headerId: model.headerId,
                                isCategory: true
                            }
                        })
                        .value();
            } else if (response.lectureScheduleCourses) {
                var models = response.lectureScheduleCourses.currentNode.courses.course;
                return _.chain(this.ensureArray(models))
                        .reject(function(model) { return model === ""; })
                        .map(function(model) {
                            return {
                                name: model.courseName,
                                type: model.courseType,
                                isCourse: true,
                                courseId: model.courseId
                            };
                        })
                        .value();
            }
        },

        ensureArray: function(param) {
            if (!param) {
                return param;
            } else if (Array.isArray(param)) {
                return param;
            } else {
                return [param];
            }
        },

        sync: function(method, model, options) {
            options.url = _.result(model, 'url');
            options.contentType = "application/json";
            options.method = "POST";
            options.data = this._selectRequestData(options.url);
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        },

        _selectRequestData: function(url) {
            var uri = new URI(url);
            var data = {condition: {}};
            if (uri.fragment()) {
                data.condition.headerId = uri.fragment();
            } else {
                data.condition.semester = 0;
            }
            return JSON.stringify(data);
        }
    });

    var VvzHistory = Backbone.Collection.extend({

        initialize: function() {
            this.listenTo(this, "add", this.triggerVvzChange);
            this.listenTo(this, "reset", this.triggerVvzChange);
        },

        openVvz: function(vvzItem) {
            var current = vvzItem.pick("name", "suburl");
            this.add(current, {at: 0});
        },

        resetToUrl: function(modelUrl) {
            var model = this.find(function(element) { return element.get("suburl") == modelUrl; });
            var remainingModels = this.last(this.length - this.indexOf(model));

            this.reset(remainingModels);
        },

        triggerVvzChange: function() {
            if (this.isEmpty()) {
                // Triggers a new function call
                this.add(new VvzItem());
            } else {
                this.trigger("vvzChange", this);
            }
        }
    });

    return {
        VvzItem: VvzItem,
        CurrentVvz: CurrentVvz,
        VvzCollection: VvzCollection,
        VvzHistory: VvzHistory
    };
});
