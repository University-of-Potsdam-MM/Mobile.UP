(function () {
    // Cache variables
    var modules = {},
        scriptTags = [];

    /**
     * Load script from the path and bind callback on onload event passing
     *      result of async require of given module.
     *
     * @param path {String} path to containing module script
     * @param moduleName {String} module name
     * @param callback {Function} callback function
     */
    function loadScript(path, moduleName, callback) {
        var scriptTag = document.createElement('script');
        scriptTag.src = path;
        // cache script tag for later cleanup
        scriptTags.push(scriptTag);
        scriptTag.onload = function () { callback(require(moduleName)); };
        document.body.appendChild(scriptTag);
    }

    /**
     * Define module by writing its defining function to a cache closure var.
     *
     * @param moduleName {String} module name
     * @param fn {Function} function that defines module
     */
    function define(moduleName, fn) {
        // Cache module function in closure var
        modules[moduleName] = fn;
    }

    /**
     * Synchronously require module and return populated exports object.
     *
     * @param moduleName {String} module name
     * @throws Will throw error if module is not found in cache.
     */
    function require(moduleName) {
        // Init empty exports object and pass it into defining module function
        var exports = {},
            module = {exports: exports};
        if (!modules[moduleName]) throw new Error ('module [' + moduleName +
                                                   '] not found');
        modules[moduleName](exports, module);
        return module.exports;
    }

    /**
     * Try to lookup module in cache, if module has been already loaded
     *      return populated exports object via require function, if
     *      module is not loaded but present in MANIFEST list then initialize
     *      async loading of the scrypt containing this module.
     *
     * @param moduleName {String} module name
     * @param callback {Function} function that will be invokod after module
     *      has been fetched and loaded. module.exports will be passed into
     *      callback function.
     * @throws Will throw an error if module is not foind in cache or package
     *      files.
     */
    function use(moduleName, callback) {
        if (modules[moduleName]) {
            // If module is already loaded then defer callback invokation
            setTimeout(function () { callback(require(moduleName)); }, 1);
        } else {
            // else try to find module name in the manifest
            for (var m in MANIFEST) {
                if (moduleName === m) {
                    // if it's there initialize loading script file
                    loadScript(MANIFEST[m], moduleName, callback);
                    return;
                }
            }
            // if module is not found then throw an error
            throw new Error("Can't find module " + moduleName);
        }
    }

    define.modules = modules;
    define.scriptTags = scriptTags;

    window.define = define;
    window.require = require;
    window.use = use;
})();
