define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'underscore.string',
    'moment',
    'stateful.models'
], function($, _, Backbone, utils, _str, moment, models) {

    var RoomsCollection = models.StatefulCollection.extend({

        initialize: function(models, options) {
            this.startTime = options.startTime;
            this.endTime = options.endTime;
            this.campus = options.campus;
            this.building = options.building;
        },

        /*
         * Code taken from http://area51-php.erstmal.com/rauminfo/static/js/ShowRooms.js?cb=1395329676756 with slight modifications
         */
        model: function(attrs) {
            var room_match = attrs.raw.match(/^([^\.]+)\.([^\.]+)\.(.+)/);

            if (room_match) {
                attrs.campus = room_match[1];
                attrs.house = parseInt(room_match[2], 10);
                attrs.room = room_match[3];
            }
            return new Backbone.Model(attrs);
        },

        parse: function(response) {
            var results = response.rooms4TimeResponse["return"];
            return _.map(results, this.enrichData, this);
        },

        enrichData: function(result) {
            return {
                raw: result,
                startTime: this.startTime.toISOString(),
                endTime: this.endTime.toISOString()
            };
        },

        url: function() {
            var campusId = {
                "griebnitzsee": 3,
                "neuespalais": 1,
                "golm": 2
            };
            var campus = campusId[this.campus] || 2;

            var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?format=json&startTime=%s&endTime=%s&campus=%d";
            if (this.building) {
                request = request + "&building=%s";
            }
            return _str.sprintf(request, encodeURIComponent(this.startTime.toISOString()), encodeURIComponent(this.endTime.toISOString()), campus, this.building);
        }
    });

    var RoomDetailsCollections = models.StatefulCollection.extend({

        initialize: function (models, options) {
            this.startTime = options.startTime;
            this.endTime = options.endTime;
            this.campus = options.campus;
            this.house = options.house;
            this.room = options.room;
        },

        model: function(attrs) {
            attrs.startTime = new Date(attrs.startTime);
            attrs.endTime = new Date(attrs.endTime);
            attrs.startMoment = moment(attrs.startTime);
            attrs.endMoment = moment(attrs.endTime);
            attrs.title = attrs.veranstaltung;
            return new Backbone.Model(_.omit(attrs, "veranstaltung"));
        },

        parse: function(response) {
            if (typeof response.reservations4RoomResponse === "object" && response.reservations4RoomResponse  != null) {
                // The response is non-empty
                var reservations = response.reservations4RoomResponse["return"];

                if (Array.isArray(reservations)) {
                    return reservations;
                } else {
                    return [reservations];
                }
            } else {
                return [];
            }
        },

        url: function() {
            // Set start and end time
            var startTime = this.startTime;
            startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 0, 0, 0, 0);
            startTime = startTime.toISOString();
            var endTime = this.endTime;
            endTime = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate() + 1, 0, 0, 0, 0);
            endTime = endTime.toISOString();

            var request = "https://api.uni-potsdam.de/endpoints/roomsAPI/1.0/reservations4Room?format=json&startTime=%s&endTime=%s&campus=%s&building=%s&room=%s";
            return _str.sprintf(request, encodeURIComponent(startTime), encodeURIComponent(endTime), encodeURIComponent(this.campus), encodeURIComponent(this.house), encodeURIComponent(this.room));
        },

        getSortedReservations: function() {
            var reservations = this.map(function(d) { return d.attributes; });
            return _.sortBy(reservations, "startMoment");
        }
    });

    return {
        RoomsCollection: RoomsCollection,
        RoomDetailsCollections: RoomDetailsCollections
    };
});
