var fs   = require('fs');                 // nodejs.org/api/fs.html
var exec = require('child_process').exec; // nodejs.org/api/child_process.html

var PLUGINS_FILEPATH = 'plugins/';
var PLATFORMS_IOS_FILEPATH = 'platforms/ios/';
var PLATFORMS_ANDROID_FILEPATH = 'platforms/android/';

module.exports = function (context) {

    exec("rm -rf " + PLUGINS_FILEPATH);
    exec("rm -rf " + PLATFORMS_IOS_FILEPATH);
    exec("rm -rf " + PLATFORMS_ANDROID_FILEPATH);

};
