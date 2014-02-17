var express   = require('express');
var http      = require('http');
var path      = require('path');
var httpProxy = require('http-proxy');
var reload    = require('reload');

var livereload = require('express-livereload');

var app = express();

var config={};
config.watchDir = process.cwd();
livereload(app, config);
console.log('livereload when changes occure in ' + config.watchDir);

// Suche
// http://sru.gbv.de/opac-de-517?version=1.1&operation=searchRetrieve&query=java&maximumRecords=1&recordSchema=mods

// Standort
// http://daia.gbv.de/isil/DE-517?id=ppn:775459445&format=json

var bibliothekProxy = httpProxy.createServer(80, 'sru.gbv.de')
var standortProxy   = httpProxy.createServer(80, 'daia.gbv.de');


app.configure(function () {
  app.set('port', process.env.PORT || 3000);

  // app.use(express.static(__dirname + '/public'));

  app.use('/api/search',  bibliothekProxy);
  app.use('/api/place', standortProxy);

  app.use('/bower_components', express.static(__dirname + '/bower_components'));
  app.use('/node_modules',     express.static(__dirname + '/node_modules'));
  app.use('/www', express.static(__dirname + '/../www'));
});


app.configure(function(){
  app.use(express.errorHandler());
});

app.get("/", function(req, res){res.redirect('/www/');});

var server = http.createServer(app)


//reload code here
reload(server, app)


server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
