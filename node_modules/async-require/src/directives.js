var HEADER_PATTERN = /\/\/\s*=\s*(require\w*)\s*([\w\.\/]*)\s*$/gm;

/**
 * @return {Array} array of directives and their values
 */
function extract(src) {
    var match, fileNames = [];
    while (match = HEADER_PATTERN.exec(src)) {
        var directive = match[1],
            value = match[2]
            result = [directive];
        value && result.push(value);
        fileNames.push(result);
    }
    return fileNames;
}


/**
 * @param directives {Array} [['require', 'main.js'], ['require_lib']]
 * @return {Array} of objects [{wrap: true, path: './path.js'}]
 */
function processDirectives(directives) {
    var filePaths = [];
    directives.forEach(function (d) {
        filePaths = filePaths.concat(directiveToFiles(d));
    });
    return filePaths;
}

/**
 * Extract filenames that need to be required from directive
 * @param d {Array} [directiveType, directiveValue]
 * @return {Array} of objects:
 *      @return wrap {Boolean} if this file needs to be wrapped in module
 *      @return path {String} path to the file
 */
function directiveToFiles(d) {
    var type = d[0];
    switch (d[0]) {
        case 'require': return [{wrap: true, path: d[1]}];
        case 'require_lib': return [{wrap: false, path: LIB_PATH}];
    }
}

module.exports.extract = extract;
module.exports.processDirectives = processDirectives;
