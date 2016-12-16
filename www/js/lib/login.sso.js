define([
    'jquery',
    'underscore'
], function($, _) {

    var ERROR_TECHNICAL = 1;
    var ERROR_CREDENTIALS = 2;
    var ERROR_USER_CANCELLED = 3;

    /*
     SSO login, general process
     0. The caller must open a browser and initiate a navigation to the login mask
     1. Once in the login mask the credentials have to be inserted and the login form must be submitted.
     1.1 If the login succeeds we are taken to the next step
     1.2 If the login fails, we are taken back to the login mask
     2. If the user logs into the platform for the first time, an attribute release has to be accepted before we are taken back
     3. The caller must handle the redirection after a successful login
     If the user decides to close the browser window while a login is running, an error is issued.
     */
    var basicActions = {

        /*
        1. Enter credentials
         */
        ssoLogin: {
            type: "loadstop",
            predicate: function (ev, loginRequest) { return ev.url === idpUrl && !loginRequest.loginAttemptStarted; },
            action: function (ev, loginRequest) {
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
                loginRequest.browser.executeScript({ code: enterCredentials }, function(result) {});
            }
        },

        /*
         1.2 Although there already was a login attempt, we are taken to the login mask. There could be a technical problem, but we assume the login data was invalid. We have to listen for loadstop because posting the login data the first time results in a loadstart on the IdP url
         */
        loginFailed: {
            type: "loadstop",
            predicate: function(ev, loginRequest) { return ev.url === idpUrl && loginRequest.loginAttemptStarted; },
            action: function(ev, loginRequest) {
                loginRequest.error(ERROR_CREDENTIALS);
            }
        },

        /*
         2. The user has to sign an attribute release to confirm that he wants the platform to access his data. If the user disagrees, the IdP asks him to close the browser, which we detect. If the user agrees, he is taken to the platform he came from
         */
        attributeRelease: {
            type: "loadstop",
            predicate: function(ev) { return ev.url === attributeReleaseUrl; },
            action: function(ev, loginRequest) {
                loginRequest.browser.show();
            }
        },

        /*
         Something went wrong. Propagate error. Only exception: custom error predicates
         */
        technicalError: {
            type: "loaderror",
            predicate: function(ev, loginRequest) { return loginRequest.errorPredicate ? loginRequest.errorPredicate(ev, loginRequest) : true; },
            action: function(ev, loginRequest) {
                console.log("loaderror happened on " + ev.url);
                loginRequest.error(ERROR_TECHNICAL);
            }
        },

        browserClosed: {
            type: "exit",
            predicate: function() { return true; },
            action: function(ev, loginRequest) {
                console.log("browser exit");
                loginRequest.error(ERROR_USER_CANCELLED);
            }
        }
    };

    var handle = function(actions, loginRequest, event) {
        _.chain(actions)
            .filter(function(action) { return event.type === action.type })
            .filter(function(action) { return action.predicate(event, loginRequest); })
            .each(function(action) { action.action(event, loginRequest, loginRequest.browser); });
    };

    var idpUrl = "https://idp.uni-potsdam.de/idp/Authn/UserPassword";
    var attributeReleaseUrl = "https://idp.uni-potsdam.de/idp/uApprove/AttributeRelease";

    var openBrowser = function(actions, loginRequest, success, error) {
        /*var loginRequest = {
            session: session,
            browser: window.open("SHOULDALREADYBESET", "_blank", "clearcache=yes,clearsessioncache=yes,hidden=yes")
        };*/
        var browser = loginRequest.browser;

        var handleEvent = function(event) {
            handle(actions, loginRequest, event);
        };

        var freeBrowser = function(callback) {
            browser.removeEventListener("loadstart", handleEvent);
            browser.removeEventListener("loadstop", handleEvent);
            browser.removeEventListener("loaderror", handleEvent);
            browser.removeEventListener("exit", handleEvent);
            callback(loginRequest);
        };

        browser.addEventListener("loadstart", handleEvent);
        browser.addEventListener("loadstop", handleEvent);
        browser.addEventListener("loaderror", handleEvent);
        browser.addEventListener("exit", handleEvent);

        loginRequest.success = function() {
            console.log("SSO login succeeded");
            freeBrowser(success);
        };
        loginRequest.error = function() {
            console.log("SSO login failed");
            freeBrowser(error);
        }
    };

    /**
     * @param customActions
     * @param {Object} options
     * @param {string} options.browser
     * @param {Object} options.session
     * @param {Function} options.errorPredicate
     */
    var executeSsoLogin = function(customActions, options) {
        var promise = $.Deferred();
        // Merge custom actions and base actions
        // Custom actions should contain a success action and can contain a custom error predicate
        var actions = _.extend({}, customActions, basicActions);
        // Execute login
        openBrowser(actions, options, promise.resolve, promise.reject);
        return promise.promise();
    };

    return {
        executeSsoLogin: executeSsoLogin
    };
});
