define([
    './options.login',
    './moodle.sso.login'
], function(optionsLogin, moodleSso) {

    return {
        executeLogin: optionsLogin.executeLogin,
        createToken: moodleSso.createToken,
        loginUser: moodleSso.loginUser
    };
});
