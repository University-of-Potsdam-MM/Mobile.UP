var fs       = require('fs');                     // nodejs.org/api/fs.html
var execSync = require('child_process').execSync; // nodejs.org/api/child_process.html

var PLUGINS_FILEPATH = 'plugins/';
var PLATFORMS_IOS_FILEPATH = 'platforms/ios/';
var PLATFORMS_ANDROID_FILEPATH = 'platforms/android/';

module.exports = function (context) {

    execSync("rm -rf " + PLUGINS_FILEPATH);
    execSync("rm -rf " + PLATFORMS_IOS_FILEPATH);
    execSync("rm -rf " + PLATFORMS_ANDROID_FILEPATH);

};
