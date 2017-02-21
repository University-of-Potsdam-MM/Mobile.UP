define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'PulsAPI',
    'uri/URI'
], function($, _, Backbone, utils, PulsAPI, URI){
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
            var result = new URI("https://api.uni-potsdam.de/endpoints/pulsAPI/2.0/");
            if (!this.has("headerId") && !this.has("courseId")) {
                // No id known -> we are at the root
                result.filename("getLectureScheduleRoot")
                    .fragment(JSON.stringify({semester: 0}));
            } else if (this.has("headerId") && this.get("hasSubtree")) {
                // There are children -> we have to dig deeper
                result.filename("getLectureScheduleSubTree")
                    .fragment(JSON.stringify({headerId: this.get("headerId")}));
            } else if (this.has("headerId") && !this.get("hasSubtree")) {
                // No more children -> courses next
                result.filename("getLectureScheduleCourses")
                    .fragment(JSON.stringify({headerId: this.get("headerId")}));
            } else if (this.has("courseId")) {
                // There is a course id -> course details next
                result.filename("getCourseData")
                    .fragment(JSON.stringify({courseId: this.get("courseId")}));
            }
            return result.toString();
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
    var VvzCourseContent = PulsAPI.Model.extend({
        noAuth: true,

        parse: function(response) {
            // Events have to be grouped by groupId to know which dates belong together
            var groups = this.ensureArray(response.courseData.course)[0].events.event;
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
            this.items.url = vvzHistory.first().get("suburl");
            this.items.reset();
            this.items.fetch({
                reset: true
            });
        }
    });

    var VvzCollection = PulsAPI.Collection.extend({
        model: VvzItem,
        noAuth: true,

        parse: function(response) {
            if (response.lectureScheduleRoot || response.lectureScheduleSubTree) {
                var models = response.lectureScheduleRoot ? response.lectureScheduleRoot.rootNode : response.lectureScheduleSubTree.currentNode;
                models = models.childNodes.childNode;
                return _.chain(this.asArray(models))
                    .reject(function(model) { return model === ""; })
                    .reject(function(model) { return !model.headerId; })
                    .map(function(model) {
                        return {
                            name: model.headerName,
                            headerId: model.headerId,
                            isCategory: true,
                            hasSubtree: model.subNodes.count !== "0"
                        };
                    })
                    .value();
            } else if (response.lectureScheduleCourses) {
                var models = response.lectureScheduleCourses.currentNode.courses.course;
                return _.chain(this.asArray(models))
                        .reject(function(model) { return model === ""; })
                        .reject(function(model) { return !model.courseId; })
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
            this.trigger("vvzNavigateRequired", this);
        },

        resetToUrl: function(modelUrl) {
            var model = this.find(function(element) { return element.get("suburl") == modelUrl; });
            var remainingModels = this.last(this.length - this.indexOf(model));

            this.reset(remainingModels);
            this.trigger("vvzNavigateRequired", this);
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
