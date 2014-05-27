beforeEach(function () {
    for (var module in define.modules) delete define[module];
    for (var scriptTag in define.scriptTags) scriptTag.remove();
});
