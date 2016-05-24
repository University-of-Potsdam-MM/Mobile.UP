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
      1.1 If a login is required the browser gets redirected to the Moodle login page
      1.2 If the user is already logged in, a token is retrieved and the process ends
    2. On the Moodle login page the SSO / IdP login link must be followed
    3. Once in the login mask the credentials have to be inserted and the login form must be submitted. If the login succeeds we are taken back to the Moodle plugin
     */
    var actions = {

        /*
        1.2: User is logged in, the token is given as
        moodlemobile://token=<base64 passport:::token>
        Sometimes the url is preceeded by a http://
         */
        retrieveToken: {
            type: "loadstart",
            predicate: function (ev) { return ev.url.indexOf(tokenUrl) != -1 || ev.url.indexOf("http://" + tokenUrl) != -1; },
            action: function (ev, loginRequest, browser) {
                var token = ev.url;
                token = token.replace("http://", "");
                token = token.replace(tokenUrl, "");
                try {
                    token = atob(token);

                    // Skip the passport validation, just trust the token
                    console.log("Raw token: " + token);
                    console.log("Split token: " + JSON.stringify(token.split(":::")));

                    token = token.split(":::")[1];
                    console.log("Moodle token found: " + token);
                } catch (err) {
                    // error happened
                }

                browser.close();
            }
        },

        moodleLogin: {
            type: "loadstop",
            predicate: function (ev) { return ev.url === loginUrl },
            action: function (ev, loginRequest, browser) {
                console.log("Login required");
                var startLogin = 'var links = document.getElementsByTagName("a");' +
                                 'for (var i = 0; i < links.length; i++) {' +
                                 '  if (links[i].innerHTML.indexOf("Login via") != -1)' +
                                 '    window.open(links[i].href);' +
                                 '}';

                browser.executeScript({code: startLogin}, function (result) {
                    console.log(JSON.stringify(result));
                });
            }
        },

        ssoLogin: {
            type: "loadstop",
            predicate: function (ev) { return ev.url === idpUrl; },
            action: function (ev, loginRequest, browser) {
                console.log("Login required");

                var session = loginRequest.session;
                var user = session.get("up.session.username");
                var pw = session.get("up.session.password");
                var enterCredentials = 'var user = document.getElementsByName("j_username");' +
                                       'user[0].value = ' + JSON.stringify(user) + ';' +
                                       'var pw = document.getElementsByName("j_password");' +
                                       'pw[0].value = ' + JSON.stringify(pw) + ';' +
                                       'document.forms["login"].submit()';

                browser.executeScript({ code: enterCredentials }, function(result) {
                    console.log(JSON.stringify(result));
                });
            }
        }
    };

    var handle = function(actions, loginRequest, event) {
        _.chain(actions)
            .filter(function(action) { return event.type === action.type })
            .filter(function(action) { return action.predicate(event); })
            .each(function(action) { action.action(event, loginRequest, loginRequest.browser); });
    };

    var moodleBase = "https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X";
    var pluginUrl = moodleBase + "/local/mobile/launch.php?service=local_mobile&passport=1002";
    var loginUrl = moodleBase + "/login/index.php";
    var idpUrl = "https://idp.uni-potsdam.de/idp/Authn/UserPassword";
    var tokenUrl = "moodlemobile://token=";

    var openBrowser = function() {
        var loginRequest = {
            session: new Session,
            browser: window.open(pluginUrl, "_blank", "")
        };

        var browser = loginRequest.browser;
        browser.addEventListener("loadstart", function(event) {
            handle(actions, loginRequest, event);
        });

        browser.addEventListener("loadstop", function(event) {
            handle(actions, loginRequest, event);
        });
    };

    var createToken = function(options) {
        openBrowser();
    };

    return {
        createToken: createToken
    };
});
