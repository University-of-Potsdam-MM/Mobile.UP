define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'Session'
], function( $, _, Backbone, utils, Session) {

    var ERROR_TECHNICAL = 1;
    var ERROR_CREDENTIALS = 2;

    var mailUrl = "https://mailup.uni-potsdam.de/";
    var mailSuccessUrl = "https://mailup.uni-potsdam.de/Session/";

    var loginMail = function(session) {
        var result = $.Deferred();

        var user = session.get("up.session.username");
        var pw = session.get("up.session.password");
        var loginAttemptStarted = false;

        var browser = window.open(mailUrl, "_blank", "hidden=yes");

        var mailLoginSuccess = function(ev) {
            if (ev.url.startsWith(mailSuccessUrl)) {
                result.resolve();
            }
        };
        var executeMailLogin = function(ev) {
            if (ev.url === mailUrl && loginAttemptStarted) {
                // Invalid login credentials
                result.reject({code: ERROR_CREDENTIALS});
            } else if (ev.url === mailUrl && !loginAttemptStarted) {
                // Credentials required
                var enterCredentials = 'var user = document.getElementsByName("Username");' +
                                       'user[0].value = ' + JSON.stringify(user) + ';' +
                                       'var pw = document.getElementsByName("Password");' +
                                       'pw[0].value = ' + JSON.stringify(pw) + ';' +
                                       'document.forms[document.forms.length-1].submit()';

                loginAttemptStarted = true;
                browser.executeScript({ code: enterCredentials }, function(result) {});
            }
        };
        var errorCallback = function() {
            result.reject({code: ERROR_TECHNICAL});
        };

        var removeEventListeners = function() {
            browser.removeEventListener("loadstart", mailLoginSuccess);
            browser.removeEventListener("loadstop", executeMailLogin);
            browser.removeEventListener("loaderror", errorCallback);
        };

        browser.addEventListener("loadstart", mailLoginSuccess);
        browser.addEventListener("loadstop", executeMailLogin);
        browser.addEventListener("loaderror", errorCallback);

        result.always(function() {
            removeEventListeners();
        }).fail(function() {
            browser.close();
        }).done(function() {
            browser.show();
        });

        return result;
    };

    return {
        loginMail: loginMail
    };
});