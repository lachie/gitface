{spawn, exec} = require 'child_process'
{print} = require 'sys'

coffeeWatch = (from, to) ->
  options = ['-wlc', '-o', to, from]

  coffee = spawn 'coffee', options
  coffee.stdout.on 'data', (data) -> print data.toString()
  coffee.stderr.on 'data', (data) -> print data.toString()

task 'watch', 'Recompile CoffeeScript source files when modified', ->
  coffeeWatch 'src'    , 'lib'
  coffeeWatch 'scripts', 'public/javascripts'

