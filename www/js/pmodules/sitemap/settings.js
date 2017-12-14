define([
    'jquery'
], function($) {

    return {
        getCampus: function(name) {
            var result = this.url[name];
            return result || this.url.golm;
        },
        initColors: function() {
            this.options.institutes.fillColor = $(".sitemap-institutes").css("background-color");
            this.options.parking.fillColor = $(".sitemap-parking").css("background-color");
            this.options.associateinstitutes.fillColor = $(".sitemap-associateinstitutes").css("background-color");
            this.options.student.fillColor = $(".sitemap-living").css("background-color");
            this.options.sport.fillColor = $(".sitemap-sport").css("background-color");
        },
        url: {
            griebnitzsee: {
                campus: "griebnitzsee",
                center: {
                    lat: 52.39345677934452,
                    lng: 13.128039836883545
                }
            },
            neuespalais: {
                campus: "neuespalais",
                center: {
                    lat: 52.400933,
                    lng: 13.011653
                }
            },
            golm: {
                campus: "golm",
                center: {
                    lat: 52.408716,
                    lng: 12.976138
                }
            }
        },
        options: {
            terminals: { "icon": "img/up/puck-marker.png" },
            canteens: { "icon": "img/up/mensa-marker.png" },
            parking: {
                "strokeColor": "#fff",
                "strokeOpacity": 1,
                "strokeWeight": 2,
                "fillColor": "#70c8dc",
                "fillOpacity": 0.8
            },
            institutes: {
                "strokeColor": "#fff",
                "strokeOpacity": 1,
                "strokeWeight": 2,
                "fillColor": "#e57967",
                "fillOpacity": 0.8
            },
            associateinstitutes: {
                "strokeColor": "#fff",
                "strokeOpacity": 1,
                "strokeWeight": 2,
                "fillColor": "#cf6da8",
                "fillOpacity": 0.8
            },
            student: {
                "strokeColor": "#fff",
                "strokeOpacity": 1,
                "strokeWeight": 2,
                "fillColor": "#897cc2",
                "fillOpacity": 0.8
            },
            sport: {
                "strokeColor": "#fff",
                "strokeOpacity": 1,
                "strokeWeight": 2,
                "fillColor": "#B6B6B4",
                "fillOpacity": 0.8
            }
        }
    };
});