/**
 * Created by hgessner on 01.05.2016.
 */
define([
    'jquery',
    'underscore',
    'login.sso'
], function( $, _, loginSso) {

    var ERROR_TECHNICAL = 1;

    var actions = {

        /*
        User is logged in, the token is given as
        moodlemobile://token=<base64 passport:::token>
        Sometimes the url is preceeded by a http://
         */
        retrieveToken: {
            type: "loadstart",
            predicate: function (ev) { return ev.url.indexOf(tokenUrl) != -1 || ev.url.indexOf("http://" + tokenUrl) != -1; },
            action: function (ev, loginRequest) {
                var token = ev.url;
                token = token.replace("http://", "");
                token = token.replace(tokenUrl, "");
                try {
                    token = atob(token);

                    // Skip the passport validation, just trust the token
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
            action: function (ev, loginRequest) {
                console.log("IdP link required");
                var startLogin = 'window.open("https://moodle2.uni-potsdam.de/auth/shibboleth/index.php");';

                loginRequest.browser.executeScript({code: startLogin}, function (result) {});
            }
        }
    };

    var moodleBase = "https://moodle2.uni-potsdam.de";
    var pluginUrl = moodleBase + "/local/mobile/launch.php?service=local_mobile&passport=1002";
    var loginUrl = moodleBase + "/login/index.php";
    var tokenUrl = "moodlemobile://token=";

    var openBrowser = function(session, success, error) {
        var loginRequest = {
            session: session,
            browser: window.open(pluginUrl, "_blank", "clearcache=yes,clearsessioncache=yes,hidden=yes"),
            // No error on Moodle token. We can't load those but we already handle them in actions.retrieveToken
            errorPredicate: function(ev) { return ev.url.indexOf(tokenUrl) === -1 && ev.url.indexOf("http://" + tokenUrl) === -1; }
        };

        var freeBrowser = function(callback) {
            loginRequest.browser.close();
            // Waiting for browser to finish closing. Otherwise we might get a NullPointerExeption in the next InAppBrowser instance
            setTimeout(callback, 2000);
        };

        loginSso.executeSsoLogin(actions, loginRequest).done(function() {
            console.log("Moodle SSO login succeeded");
            freeBrowser(success);
        }).fail(function() {
            console.log("Moodle SSO login failed");
            freeBrowser(error);
        });
    };

    var createToken = function(session) {
        var promise = $.Deferred();
        openBrowser(session, promise.resolve, promise.reject);
        return promise.promise();
    };

    return {
        createToken: createToken
    };
});
