fs   = require 'fs'
path = require 'path'
ws   = require 'websocket.io'
http  = require 'http'
url = require 'url'
watchr = require('watchr')

version = '1.6'
defaultPort = 35729

defaultExts = [
  'html', 'css', 'js', 'png', 'gif', 'jpg',
  'php', 'php5', 'py', 'rb', 'erb', 'coffee', 'styl', 'jade'
]

defaultAlias =
  'styl': 'css'

defaultExclusions = ['.git/', '.svn/', '.hg/']

merge = (obj1, obj2) ->
  _obj = {}
  _obj[key] = value for key, value of obj1
  _obj[key] = value for key, value of obj2
  _obj

class Server
  constructor: (@config) ->
    @config ?= {}
    
    @config.version ?= version
    @config.port    ?= defaultPort

    @config.exts       ?= []
    @config.exclusions ?= []
    @config.alias      ?= {}
    @config.delay      ?= 0
    @config.exts       = @config.exts.concat defaultExts
    @config.exclusions = @config.exclusions.concat defaultExclusions
    @config.alias      = merge( defaultAlias, @config.alias )

    @config.applyJSLive  ?= false
    @config.applyCSSLive ?= true

    @sockets = []
    
  listen: ->
    @debug "LiveReload is waiting for browser to connect."
    
    if @config.server
      @config.server.listen @config.port
      @server = ws.attach(@config.server)
    else
      @server = ws.listen(@config.port)

    @server.on 'connection', @onConnection.bind @
    @server.on 'close',      @onClose.bind @


  onConnection: (socket) ->
    @debug "Browser connected."
    socket.on 'error', (err) =>
      @debug "Browser disconnected."
      idx = @sockets.indexOf(socket)
      @sockets.splice(idx, 1)
    socket.send "!!ver:#{@config.version}"

    socket.on 'message', (message) =>
      @debug "Browser URL: #{message}"

    @sockets.push socket
    
  onClose: (socket) ->
    @debug "Browser disconnected."
  
  watch: (source)=>

    # Watch a directory or file
    exts       = @config.exts
    exclusions = @config.exclusions

    watchr.watch
      path: source
      ignoreHiddenFiles: yes
      listener: (eventName, filePath, fileCurrentStat, filePreviousStat)=>

        for exclusion in exclusions
          return if filePath.match exclusion
        
        for ext in exts when filePath.match "\.#{ext}$"
          @refresh(filePath)
    

  refresh: (filepath) ->
    @debug "Refresh: #{filepath}"
    ext       = path.extname(filepath).substr(1)
    aliasExt  = @config.alias[ext]
    if aliasExt?
      @debug "and aliased to #{aliasExt}"
      filepath = filepath.replace("." + ext, ".#{aliasExt}")
      
    data = JSON.stringify ['refresh',
      path: filepath,
      apply_js_live: @config.applyJSLive,
      apply_css_live: @config.applyCSSLive
    ]
    if @config.delay is 0
      for socket in @sockets
        socket.send data
    else
      clearTimeout( @delayTimeout )
      @delayTimeout = setTimeout =>
        for socket in @sockets
          socket.send data
      , @config.delay
    return
        

  debug: (str) ->
    if @config.debug
      console.log "#{str}\n"

exports.createServer = (config) ->
  app = http.createServer ( req, res )->
    if url.parse(req.url).pathname is '/livereload.js'
      res.writeHead(200, {'Content-Type': 'text/javascript'})
      res.end fs.readFileSync __dirname + '/../ext/livereload.js'

  config.server ?= app

  server = new Server config
  server.listen()
  server

