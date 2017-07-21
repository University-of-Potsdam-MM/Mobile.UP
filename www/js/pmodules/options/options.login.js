define([
    'jquery',
    'underscore',
    'Session',
    'pmodules/moodle/moodle.sso.login',
    'utils'
], function($, _, Session, moodleSSO, utils) {

    var cleanUsername = function(session, promise) {
        var username = session.get("up.session.username");

        // Remove mail suffix, only username is needed
        var suffixIndex = username.indexOf("@");
        if (suffixIndex != -1) {
            username = username.substr(0, suffixIndex);

            session.set("up.session.username", username);
            promise.notify(session);
        }

        // Usernames have to be all lower case, otherwise some service logins will fail
        username = username.toLowerCase();

        session.set("up.session.username", username);
        promise.notify(session);
    };

    var executeUserPasswordLogin = function(session) {
        var result = $.Deferred();

        cleanUsername(session, result);

        var url = "https://api.uni-potsdam.de/endpoints/moodleAPI/1.0/login/token.php";
        url +="?username="+encodeURIComponent(session.get("up.session.username"));
        url +="&password="+encodeURIComponent(session.get("up.session.password"));
        url +="&service=moodle_mobile_app&moodlewsrestformat=json";

        $.ajax({
            url: url,
            headers: { "Authorization": utils.getAuthHeader() }
        }).done(function(response) {
            if(response['error']) {
                result.reject({ code: response.error });
            } else {
                session.set('up.session.authenticated', true);
                result.resolve(session);
            }
        }).fail(function(jqXHR) {
            result.reject({code: "missingConnection"});
        });

        return result.promise();
    };

    var executeSsoLogin = function(session) {
        var result = $.Deferred();

        cleanUsername(session, result);

        moodleSSO.createToken(session).done(function() {
            result.resolve(session);
        }).fail(function(loginRequest) {
            var errors = {
                1: "missingConnection",
                2: "wrongPassword",
                3: "userCancelled"
            };

            result.reject({
                code: errors[loginRequest.errorCode]
            });
        });

        return result.promise();
    };

    /**
     * Handles the login of a user. If in browser, a simple login is performed. If in app, a SSO login is performed and a Moodle token is fetched.
     * @param {Session} session Session object with username and password
     * @returns {*} jQuery promise. On successful login the promise is resolved with a Session. On failed login the promise is resolved with an error object containing error message and error code. On modified login data the promise is updated / notified with the login object.
     */
    var executeLogin = function(session) {
        if (window.cordova) {
            return executeSsoLogin(session);
        } else {
            return executeUserPasswordLogin(session);
        }
    };

    return {
        executeLogin: executeLogin
    };
});
