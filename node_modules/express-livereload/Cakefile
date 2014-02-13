{spawn} = require 'child_process'

task 'build', 'Build CoffeeScript source files', ->
  coffee = spawn 'coffee', ['-o', './lib', '-cw', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()
