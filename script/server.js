var express   = require('express');
var http      = require('http');
var https     = require('https');
var path      = require('path');
var httpProxy = require('http-proxy');

var app = express();

var config={};
config.watchDir = process.cwd();

app.set('port', process.env.PORT || 3000);

var proxy = httpProxy.createProxyServer();

function proxyTo(url){
  return function(req, res){
    proxy.web(req, res, { target: url }, function(e) {
      console.log(e);
    });
  };
}

// Bibliothekssuche
// http://sru.gbv.de/opac-de-517?version=1.1&operation=searchRetrieve&query=java&maximumRecords=1&recordSchema=mods
app.use('/api/search',    proxyTo('http://sru.gbv.de') );
// Standort
// http://daia.gbv.de/isil/DE-517?id=ppn:775459445&format=json
app.use('/api/place',     proxyTo('http://daia.gbv.de') );
app.use('/api/transport', proxyTo('http://demo.hafas.de') );
app.use('/api/moodle',    proxyTo('http://erdmaennchen.soft.cs.uni-potsdam.de') );


app.use('/node_modules',
  express.static(__dirname + '/node_modules'));

app.use('/www',
  express.static(__dirname + '/../www'));

app.get("/", function(req, res){
  res.redirect('/www/');
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
