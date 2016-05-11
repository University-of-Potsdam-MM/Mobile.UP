/**
 * Created by hgessner on 01.05.2016.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'Session'
], function( $, _, Backbone, utils, Session ) {

    var pluginUrl = "https://erdmaennchen.soft.cs.uni-potsdam.de/moodle_up2X/local/mobile/launch.php?service=local_mobile&passport=1002";

    var followRedirects = function(url, success, error) {
        var checkForSpecialPages = function(html, status, jqXHR) {
            // Moodle Login Page -> go to IdP
            var href = $(html).find("a:contains('Login via')").attr("href");
            if (href) {
                followRedirects(href, success, error);
                return;
            }

            // IdP -> send login data
            var form = $(html).find("form[action='/idp/Authn/UserPassword']");
            form.find("input[name='j_username']").val("hgessner");
            form.find("input[name='j_password']").val("mypassword");
            if (form) {
                var formData = form.serialize();
                debugger;
            }
        };

        $.ajax({
            url: url,
            success: checkForSpecialPages,
            error: error,
            statusCode: {
                303: function(jqXHR) {
                    console.log(jqXHR);
                    debugger;
                }
            }
        });
    };

    var createToken = function(options) {
        followRedirects(pluginUrl, function(a, b, c, d, e) {
            console.log("Success");
            debugger;
        }, function (a, b, c, d, e) {
            console.log("Error");
            debugger;
        })
    };

    return {
        createToken: createToken
    };
});
