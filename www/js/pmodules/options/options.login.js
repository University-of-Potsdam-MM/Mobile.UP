define([
    'jquery',
    'underscore',
    'Session',
    'pmodules/moodle/moodle.sso.login',
    'utils'
], function($, _, Session, moodleSSO, utils) {

    var cleanUsername = function(login, promise) {
        // Remove mail suffix, only username is needed
        var suffixIndex = login.username.indexOf("@");
        if (suffixIndex != -1) {
            login.username = login.username.substr(0, suffixIndex);
            promise.notify(login);
        }

        // Usernames have to be all lower case, otherwise some service logins will fail
        login.username = login.username.toLowerCase();
        promise.notify(login);
    };

    var executeUserPasswordLogin = function(login) {
        var result = $.Deferred();

        cleanUsername(login, result);

        var session = login.session;
        session.set("up.session.username", login.username);
        session.set("up.session.password", login.password);

        var url = "https://api.uni-potsdam.de/endpoints/moodleAPI/1.0/login/token.php";
        url +="?username="+encodeURIComponent(login.username);
        url +="&password="+encodeURIComponent(login.password);
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

    var executeSsoLogin = function(login) {
        var result = $.Deferred();

        cleanUsername(login, result);

        var session = login.session;
        session.set("up.session.username", login.username);
        session.set("up.session.password", login.password);

        moodleSSO.createToken(session).done(function() {
            result.resolve(session);
        }).fail(function() {
            result.reject({code: "missingConnection"});
        });

        return result.promise();
    };

    /**
     * Handles the login of a user. If in browser, a simple login is performed. If in app, a SSO login is performed and a Moodle token is fetched.
     * @param {Object} login Login data
     * @param {string} login.username Username
     * @param {string} login.password Password
     * @param {Session} login.session Session object to be used
     * @returns {*} jQuery promise. On successful login the promise is resolved with a Session. On failed login the promise is resolved with an error object containing error message and error code. On modified login data the promise is updated / notified with the login object.
     */
    var executeLogin = function(login) {
        if (window.cordova) {
            return executeSsoLogin(login);
        } else {
            return executeUserPasswordLogin(login);
        }
    };

    return {
        executeLogin: executeLogin
    };
});
