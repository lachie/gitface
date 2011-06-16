git = require('./git')
Config = require('./config')
{exec} = require('child_process')
util = require 'util'
_ = require 'underscore'


serve = (cfg) ->
  app = require('./app')
  app.listen(cfg.port)
  console.log("Gitface server listening on port %d ... come visit on #{cfg.baseUrl()}", app.address().port) #"


open = (cfg) ->
  git.dotGit (err, root) ->
    throw err if err
    exec "open #{cfg.repoUrl(root)}"


dump = (cfg) ->
  git.dotGit (err, root) ->
    throw err if err?

    git.abbreviatedHistory root, {limit: 100}, (history, ok) ->
      console.log history.commits


Config.getUserConfig (err, cfg) ->
  throw err if err?

  args = process.argv.slice(2)

  switch args.pop()
    when 'serve'
      serve(cfg)
    when 'dump'
      dump(cfg)
    else
      open(cfg)



  #gitPath()

  #open url()
