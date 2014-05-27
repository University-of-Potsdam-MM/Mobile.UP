var coffee = require('coffee-script');

module.exports = function (src) {
    return coffee.compile(src);
};
