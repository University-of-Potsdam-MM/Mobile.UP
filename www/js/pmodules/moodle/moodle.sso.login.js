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

    var ERROR_TECHNICAL = 1;
    var ERROR_CREDENTIALS = 2;

    /*
    Moodle token retrieval and Moodle SSO login, general process
    1. Call the Moodle plugin
      1.1 If a login is required the browser gets redirected to the Moodle login page
      1.2 If the user is already logged in, a token is retrieved and the process ends
    2. On the Moodle login page the SSO / IdP login link must be followed
    3. Once in the login mask the credentials have to be inserted and the login form must be submitted.
      3.1 If the login succeeds we are taken back to the Moodle plugin
      3.2 If the login fails, we are taken back to the login mask
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

                    var session = loginRequest.session;
                    session.set('up.session.MoodleToken', token);
                    session.set('up.session.authenticated', true);

                    loginRequest.success();
                } catch (err) {
                    // error happened
                    loginRequest.error(ERROR_TECHNICAL);
                }
            }
        },

        moodleLogin: {
            type: "loadstop",
            predicate: function (ev) { return ev.url === loginUrl },
            action: function (ev, loginRequest, browser) {
                console.log("IdP link required");
                var startLogin = 'var links = document.getElementsByTagName("a");' +
                                 'for (var i = 0; i < links.length; i++) {' +
                                 '  if (links[i].innerHTML.indexOf("Login via") != -1)' +
                                 '    window.open(links[i].href);' +
                                 '}';

                browser.executeScript({code: startLogin}, function (result) {});
            }
        },

        ssoLogin: {
            type: "loadstop",
            predicate: function (ev, loginRequest) { return ev.url === idpUrl && !loginRequest.loginAttemptStarted; },
            action: function (ev, loginRequest, browser) {
                console.log("Login inject required");

                var session = loginRequest.session;
                var user = session.get("up.session.username");
                var pw = session.get("up.session.password");
                var enterCredentials = 'var user = document.getElementsByName("j_username");' +
                                       'user[0].value = ' + JSON.stringify(user) + ';' +
                                       'var pw = document.getElementsByName("j_password");' +
                                       'pw[0].value = ' + JSON.stringify(pw) + ';' +
                                       'document.forms["login"].submit()';

                loginRequest.loginAttemptStarted = true;
                browser.executeScript({ code: enterCredentials }, function(result) {});
            }
        },

        /*
        3.2 Although there already was a login attempt, we are taken to the login mask. There could be a technical problem, but we assume the login data was invalid. We have to listen for loadstop because posting the login data the first time results in a loadstart on the IdP url
         */
        loginFailed: {
            type: "loadstop",
            predicate: function(ev, loginRequest) { return ev.url === idpUrl && loginRequest.loginAttemptStarted; },
            action: function(ev, loginRequest) {
                loginRequest.error(ERROR_CREDENTIALS);
            }
        },

        /*
        Something went wrong. Propagate error. Only exception: Moodle token. We can't load that but we already handle it
         */
        technicalError: {
            type: "loaderror",
            predicate: function(ev) { return ev.url.indexOf(tokenUrl) === -1 && ev.url.indexOf("http://" + tokenUrl) === -1; },
            action: function(ev, loginRequest) {
                console.log("loaderror happened on " + ev.url);
                loginRequest.error(ERROR_TECHNICAL);
            }
        }
    };

    var handle = function(actions, loginRequest, event) {
        _.chain(actions)
            .filter(function(action) { return event.type === action.type })
            .filter(function(action) { return action.predicate(event, loginRequest); })
            .each(function(action) { action.action(event, loginRequest, loginRequest.browser); });
    };

    var moodleBase = "https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X";
    var pluginUrl = moodleBase + "/local/mobile/launch.php?service=local_mobile&passport=1002";
    var loginUrl = moodleBase + "/login/index.php";
    var idpUrl = "https://idp.uni-potsdam.de/idp/Authn/UserPassword";
    var tokenUrl = "moodlemobile://token=";

    var openBrowser = function(success, error) {
        var loginRequest = {
            session: new Session,
            browser: window.open(pluginUrl, "_blank", "clearcache=yes,clearsessioncache=yes,hidden=yes")
        };
        var browser = loginRequest.browser;

        var handleEvent = function(event) {
            handle(actions, loginRequest, event);
        };

        var freeBrowser = function() {
            browser.removeEventListener("loadstart", handleEvent);
            browser.removeEventListener("loadstop", handleEvent);
            browser.removeEventListener("loaderror", handleEvent);
            browser.removeEventListener("exit", handleEvent);
            browser.close();
        };

        browser.addEventListener("loadstart", handleEvent);
        browser.addEventListener("loadstop", handleEvent);
        browser.addEventListener("loaderror", handleEvent);
        browser.addEventListener("exit", handleEvent);

        loginRequest.success = function() {
            console.log("Success called");
            freeBrowser();
            success();
        };
        loginRequest.error = function() {
            console.log("Error called");
            freeBrowser();
            error();
        }
    };

    var createToken = function() {
        var promise = $.Deferred();
        openBrowser(promise.resolve, promise.reject);
        return promise.promise();
    };

    return {
        createToken: createToken
    };
});
