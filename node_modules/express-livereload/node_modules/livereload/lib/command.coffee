runner = ->

  fs         = require( 'fs' )
  version    = JSON.parse( fs.readFileSync( __dirname + '/../package.json', 'utf-8' ) ).version

  livereload = require './livereload'
  resolve    = require('path').resolve

  trim       = ( s )-> s.replace(/^\s+|\s+$/g, '')
  list       = ( val )-> val.split( ',' ).map( ( d )-> trim( d ) )
  
  program    = require( 'commander' )
  
  
  program
    .version( version )
    .option( '-p, --port <n>', 'Specify the port', parseInt )
    .option( '-i, --interval <n>', 'Specify the delay to fire the refresh', parseInt )
    .option( '-e, --exclusions <list>', 'Ignore specific files', list )
    .option( '-d, --dev', 'Output logs' )
    .parse( process.argv )
  
  debug = program.dev
  port = program.port || 35729
  delay = program.interval || 0
  exclusions = program.exclusions || []
  server = livereload.createServer({port: port, debug: debug, delay: delay, exclusions: exclusions })
  
  path = resolve( '.' )
  if debug
    console.log('Starting LiveReload for ' + path)

  server.watch(path)

module.exports =
  run: runner
