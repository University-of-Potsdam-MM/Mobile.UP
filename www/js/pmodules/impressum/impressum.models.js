define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    var VersionModel = Backbone.Model.extend({

        fetch: function(options) {
            var result = $.Deferred();

            var that = this;
            var finalize = function(vNumber, vCode) {
                var data = {
                    "versionNumber": vNumber,
                    "versionCode": vCode
                };
                that.set(data);
                result.resolve(data, null, result);
                that.trigger("sync", that, data, options);
            };

            if (window.cordova) {
                window.cordova.getAppVersion.getVersionNumber(function(vNumber) {
                    window.cordova.getAppVersion.getVersionCode(function(vCode) {
                        finalize(vNumber, vCode);
                    });
                });
            } else {
                finalize("N/A", "N/A");
            }

            return result.promise();
        }
    });

    return {
        VersionModel: VersionModel
    };
});
