"use strict";

define([
  'underscore'
], function( _ ) {

  var utils = {};

  // /**
  //  * Generic function for adding the wstoken to Moodle urls and for pointing to the correct script.
  //  * For download remote files from Moodle we need to use the special /webservice/pluginfile
  //  * passing the ws token as a get parameter.
  //  *
  //  * @param {string} url The url to be fixed.
  //  */
  utils.fixPluginfile = function(token, url) {

    // First check if we need to fix this url or is already fixed.
    if (url.indexOf('token=') != -1) {
      return url;
    }

    // Check if is a valid URL (contains the pluginfile endpoint).
    if (url.indexOf('pluginfile') == -1) {
      return url;
    }

    // Do we already use a query string?
    if (url.indexOf('?') != -1) {
      url += '&';
    } else {
      url += '?';
    }
    url += 'token=' + token;

    // Some webservices returns directly the correct download url, others not.
    if (url.indexOf('/webservice/pluginfile') == -1) {
      url = url.replace('/pluginfile', '/webservice/pluginfile');
    }
    return url;
  };

  utils.urlSearchPattern = /(\b(https?):\/\/[-A-Z0-9+&amp;@#\/%?=~_|!:,.;]*[-A-Z0-9+&amp;@#\/%=~_|])/ig;
  utils.fixPluginfileInString = function(token, string) {
    if (string) {
      string = string.replace(
        utils.urlSearchPattern,
        function(match, pos, string){
          return utils.fixPluginfile(token, match);
        }
      );
    }
    return string;
  }

  utils.fixPluginfileForCourseContents = function(token, contents_arr){

    var fixed_contents_arr = _.map(contents_arr, function(c){
      c.summary = utils.fixPluginfileInString(token, c.summary);
      c.modules = _.map(c.modules, function(m){
        m.description = utils.fixPluginfileInString(token, m.description);

        m.contents = _.map(m.contents, function(mc){
          if (mc.fileurl) {
            mc.fileurl = utils.fixPluginfile(token, mc.fileurl);
          }
          return mc;
        });
        return m;
      });
      return c;
    })
    return fixed_contents_arr;
  }

  return utils;
});
