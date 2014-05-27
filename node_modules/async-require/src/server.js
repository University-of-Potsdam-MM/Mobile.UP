var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    argv = require('minimist')(process.argv.slice(2)),
    ASYNC_REQUIRE_PATH = './assets/async_require.js',
    config = require('./config.js'),
    compile = require('./compile.js');

config.configPath = argv.config;
config.assetPath = argv.path;

if (!config.assetPath) throw new Error('path must be present');

http.createServer(function (req, res) {
    console.log('requested :::: ' + req.url);
    // TODO: move lib.js to directives
    // e.g.
    //      //= require_lib
    var filePath = '.' + req.url,
        promise = compile.compile(filePath);
    promise.then(function (src) {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(src);
    }).fail(function (err) {
        console.log(err)
        console.log(err && err.stack);
        res.writeHead(404, {'Content-Type': 'application/javascript'});
        res.end();
    });
}).listen(6969);

console.log('Server is listening on 6969');
