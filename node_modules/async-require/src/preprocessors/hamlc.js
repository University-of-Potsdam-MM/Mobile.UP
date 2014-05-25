hamlc = require('haml-coffee');

var PREFIX = 'module.exports = ';

module.exports = function (src) {
    return PREFIX + hamlc.template(src, null, null, {placement: 'standalone'});
};
