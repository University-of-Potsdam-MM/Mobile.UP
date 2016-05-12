/**
 * Created by hgessner on 01.05.2016.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'Session',
    'uri/URI'
], function( $, _, Backbone, utils, Session, URI) {

    /*
    Moodle token retrieval and Moodle SSO login, general process
    1. Call the Moodle plugin
      - If a login is required the browser gets redirected to the Moodle login page
      - If the user is already logged in, a token is retrieved and the process ends
    2. On the Moodle login page the SSO login link must be followed
    3. Once in the login mask the credentials have to be inserted and the login form must be submitted. If the login succeeds we are taken back to the Moodle plugin
     */

    var pluginUrl = "https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/local/mobile/launch.php?service=local_mobile&passport=1002";
    var loginUrl = "https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/login/index.php";
    var idpUrl = "https://idp.uni-potsdam.de/idp/Authn/UserPassword";
    var tokenUrl = "moodlemobile://token=";

    var startLogin = 'var links = document.getElementsByTagName("a");' +
                     'for (var i = 0; i < links.length; i++) {' +
                     '  if (links[i].innerHTML.indexOf("Login via") != -1)' +
                     '    window.open(links[i].href);' +
                     '}';

    var enterCredentials = function() {
        var session = new Session();
        var user = session.get("up.session.username");
        var pw = session.get("up.session.password");
        return 'var user = document.getElementsByName("j_username");' +
               'user[0].value = "' + user + '";' +
               'var pw = document.getElementsByName("j_password");' +
               'pw[0].value = "' + pw + '";' +
               'document.forms["login"].submit()';
    };

    var openBrowser = function() {
        var browser = window.open(pluginUrl, "_blank", "");
        browser.addEventListener("loadstart", function(details) {
            if (details.url.indexOf(tokenUrl) != -1 || details.url.indexOf("http://" + tokenUrl) != -1) {
                var token = details.url;
                token = token.replace("http://", "");
                token = token.replace(tokenUrl, "");
                try {
                    token = atob(token);

                    // Skip the passport validation, just trust the token
                    console.log("Raw token: " + token);
                    console.log("Split token: " + JSON.stringify(token.split("::")));

                    token = token.split(":::")[1];
                    console.log("Moodle token found: " + token);
                } catch (err) {
                    // error happened
                }

                browser.close();
            }
        });

        browser.addEventListener("loadstop", function(details) {
            if (details.url === loginUrl) {
                console.log("Login required");
                browser.executeScript({ code: startLogin }, function(result) {
                    console.log(JSON.stringify(result));
                });
            }
            if (details.url === idpUrl) {
                console.log("Login required");
                browser.executeScript({ code: enterCredentials() }, function(result) {
                    console.log(JSON.stringify(result));
                });
            }
        });
    };

    var createToken = function(options) {
        openBrowser();
    };

    return {
        createToken: createToken
    };
});
