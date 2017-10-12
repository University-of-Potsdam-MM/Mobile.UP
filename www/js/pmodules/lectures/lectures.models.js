define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'PulsAPI',
    'uri/URI'
], function($, _, Backbone, utils, PulsAPI, URI) {

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
            if (response.courseData && response.courseData !=""){
                var groups = this.asArray(response.courseData.course)[0].events.event;
                var groupedEvents = _.groupBy(this.asArray(groups), "groupId");

                var joinLecturers = function(lecturers) {
                    return _.map(lecturers, function (l) {
                        return (l.lecturerTitle ? l.lecturerTitle + " " : "") + l.lecturerLastname;
                    }).join(", ");
                };

                return _.extend({}, {
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
                                    lecturer: joinLecturers(this.asArray(date.lecturers.lecturer))
                                };
                            }, this)
                        }
                    }, this)
                }, response.courseData.course[0]);
            }else{
                return null;
            }
        }
    });

    /**
     * Possible types of VvzCategory models
     * @enum {string}
     * @type {{CATEGORY: string, COURSE: string}}
     */
    var VvzCategoryTypes = {
        CATEGORY: "category",
        COURSE: "course"
    };

    /**
     * Represents a lecture course (Kurs).
     * @class
     * @property {VvzCategoryTypes} type Type of the model (always "course")
     * @property {string} name Name of the course (e.g. "Intelligente Datenanalyse 2")
     * @property {string} courseId Id of the course (e.g. "56194")
     * @property {string} courseType Type if the course (e.g. "Vorlesung")
     */
    var VvzCourseItem = Backbone.Model.extend({
        defaults: {
            type: VvzCategoryTypes.COURSE
        },

        /**
         * @returns {VvzCourseContent}
         */
        createCourse: function() {
            var submodel = new VvzCourseContent;
            submodel.url = this._createSubUrl();
            return submodel;
        },

        _createSubUrl: function() {
            return new URI("https://apiup.uni-potsdam.de/endpoints/pulsAPI/2.0/")
                .filename("getCourseData")
                .fragment(JSON.stringify({courseId: this.get("courseId")}))
                .toString();
        }
    });

    /**
     * Represents a lecture category (Kategorie / Überschrift)
     * @class
     * @property {VvzCategoryTypes} type
     * @property {string} name Label of the category (e.g. "Intelligente Datenanalyse in den Naturwissenschaften")
     * @property {string} headerId Id of the category (e.g. "121431")
     * @property {boolean} hasSubtree Indicator whether this category contains sub categories (true) or courses (false)
     */
    var VvzCategoryItem = Backbone.Model.extend({
        defaults: {
            type: VvzCategoryTypes.CATEGORY
        },

        /**
         * @returns {VvzCategory}
         */
        createSubtree: function() {
            return new VvzCategory(null, {name: this.get("name"), headerId: this.get("headerId"), hasSubtree: this.get("hasSubtree")});
        }
    });

    /**
     * Holds lecture courses or lecture categories. You can distinguish between these two by checking the model property "type". Only contains one type of model at a time
     * @class
     * @property {string} name
     * @property {string} headerId
     * @property {boolean} hasSubtree
     */
    var VvzCategory = PulsAPI.Collection.extend({
        noAuth: true,

        model: function (attrs, options) {
            if (attrs.headerId) {
                return new VvzCategoryItem(attrs, options);
            } else {
                return new VvzCourseItem(attrs, options);
            }
        },

        initialize: function(models, options) {
            _.extend(this, _.pick(options, "headerId", "name", "hasSubtree"));
        },

        url: function() {
            var result = new URI("https://apiup.uni-potsdam.de/endpoints/pulsAPI/2.0/");
            if (!this.headerId) {
                // No id known -> we are at the root
                result.filename("getLectureScheduleRoot")
                    .fragment(JSON.stringify({semester: 0}));
            } else if (this.hasSubtree) {
                // There are children -> we have to dig deeper
                result.filename("getLectureScheduleSubTree")
                    .fragment(JSON.stringify({headerId: this.headerId}));
            } else {
                // No more children -> courses next
                result.filename("getLectureScheduleCourses")
                    .fragment(JSON.stringify({headerId: this.headerId}));
            }
            return result.toString();
        },

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
                        return model
                    })
                    .value();
            }
        }
    });

    /**
     * @type {{name: string, headerId: string, hasSubtree: boolean}}
     */
    var VvzNavigationItem = {
    };

    /**
     * Holds all parent categories. The current category can be changed by calling {@link addOrReset}.
     * @type {{hierarchy: Array.<VvzNavigationItem>}}
     */
    var VvzNavigation = {
        hierarchy: [{headerId: undefined, name: "Vorlesungsverzeichnis", hasSubtree: true}],

        /**
         * Checks if the given headerId is contained within the hierarchy list. If it is, all entries after the item are discarded. If not, the item is added to the list. The empty id is always contained and reserved for the lectures root
         * @param headerId
         * @param name
         * @param hasSubtree
         * @returns VvzNavigationItem Last item of the new hierarchy
         */
        addOrReset: function(headerId, name, hasSubtree) {
            var existingItemIndex = _.findIndex(this.hierarchy, function(item) { return item.headerId === headerId; });
            if (existingItemIndex !== -1) {
                this.hierarchy.splice(existingItemIndex + 1);
            } else {
                this.hierarchy.push({
                    headerId: headerId,
                    name: name,
                    hasSubtree: hasSubtree
                });
            }
            return this.hierarchy[this.hierarchy.length - 1];
        },

        /**
         * Finds the given headerId within the hierarchy list and returns the entry
         * @param headerId
         * @returns VvzNavigationItem
         */
        find: function(headerId) {
            return _.find(this.hierarchy, function(item) { return item.headerId === headerId; });
        }
    };

    return {
        VvzCategory: VvzCategory,
        VvzNavigation: VvzNavigation
    };
});
