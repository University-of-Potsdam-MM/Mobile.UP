# Express Livereload

This is really small plugin for express, which will run `LiveReload` server simultaniously for development.

### Installation

npm install express-livereload

### Usage

    livereload = require('express-livereload')
    app        = express()

    livereload(app, config={})

#### Static helper

This plugin will attach `LRScript` which renders the snippet for loading `livereload.js` script.

`layout.jade`

    doctype 5
    html
      head
        title= title
        link(rel='stylesheet', href='/stylesheets/style.css')
        != LRScript


`compiled.html`

    <!DOCTYPE html>
    <html>
      <head>
        <title>Express</title>
        <link rel="stylesheet" href="/stylesheets/style.css">
        <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js"></' + 'script>')</script>
      </head>
    </html>



### Config options

`config` objects can accept same options as [node-livereload] does, but with one extra key to specify which directry to watch out for.

    config.watchDir = /path/to/dir or process.cwd() + "/public"


[node-livereload]: https://github.com/napcs/node-livereload#options
