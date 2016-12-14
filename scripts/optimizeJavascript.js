var fs        = require('fs');        // nodejs.org/api/fs.html
var requirejs = require('requirejs'); // http://requirejs.org/docs/node.html#optimizer

var TARGET_PATH = {
    'ios': 'platforms/ios/assets/www/js/main.js', // TODO: check path
    'android': 'platforms/android/assets/www/js/main.js'
};

module.exports = function (context) {
    var config = {
        baseUrl: 'www/js',
        mainConfigFile: 'www/js/main.js',
        name: 'main',
        out: 'www/main-built.js'
    };

    var Q = context.requireCordovaModule('q');
    var result = new Q.defer();

    // Only optimise in release mode
    if (context.opts.options && context.opts.options.release) {

        // Call optimizer
        console.log("Optimizing Javascript code");
        requirejs.optimize(config, function(buildResponse) {

            // Optimizing succeeded. Move file to target location
            context.opts.platforms.forEach(function(platform) {

                console.log("Moving optimized code for " + platform + " to " + TARGET_PATH[platform]);
                fs.rename(config.out, TARGET_PATH[platform], function(err) {
                    // If error happend while moving, fail. Otherwise succeed
                    if (err) {
                        result.reject(err);
                    } else {
                        result.resolve();
                    }
                });

            });

        }, function(err) {
            result.reject(err);
        });

    } else {
        result.resolve();
    }

    return result.promise;
};
