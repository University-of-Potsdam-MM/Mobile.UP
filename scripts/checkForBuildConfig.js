module.exports = function (context) {

    // Build config is required for signing
    if (!context.opts.options || !context.opts.options.buildConfig) {
        throw new Error("Release builds require a buildConfig. Set one with --buildConfig=release-config.json");
    }

};
