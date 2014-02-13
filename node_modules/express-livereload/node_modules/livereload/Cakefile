{spawn} = require 'child_process'

task 'build', 'Build CoffeeScript source files', ->
  coffee = spawn 'coffee', ['-cw', 'lib']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()
