define([
    'backboneMVC'
], function(BackboneMVC) {

    var BaseController = BackboneMVC.Controller.extend({
        name: 'baseController',

        /**
         * Checks if a session exists. Invoked if the user tries to access
         * a restricted route. Access is granted if the user is logged in.
         * If the user is not logged in, the redirectFrom session field is
         * set and the login page is opened.
         * @returns {boolean} true if access is allowed, false otherwise
         */
        checkSession: function() {
            var path = Backbone.history.location.hash;
            var isAuth = this._isAuthenticated();
            if (!isAuth) {
                // If user gets redirect to login because wanted to access
                // to a route that requires login, save the path in session
                // to redirect the user back to path after successful login
                app.session.set('up.session.redirectFrom', path);
                Backbone.history.navigate('options/login', { trigger : true });
                return false;
            } else {
                return true;
            }
        },

        _isAuthenticated: function() {
            return app.session.get('up.session.authenticated');
        }
    });

    return BaseController;
});