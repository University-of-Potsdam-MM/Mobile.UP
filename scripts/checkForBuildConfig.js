module.exports = function (context) {

    // Build config is required for signing
    var opts = context.opts;
    if (opts.options && opts.options.release && !opts.options.buildConfig) {
        throw new Error("Release builds require a buildConfig. Set one with --buildConfig=release-config.json");
    }

};
