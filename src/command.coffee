git = require('./git')
Config = require('./config')
{exec} = require('child_process')


serve = (cfg) ->
  app = require('./app')
  app.listen(cfg.port)
  console.log("Gitface server listening on port %d ... come visit on #{cfg.baseUrl()}", app.address().port) #"


open = (cfg) ->
  git.dotGit (err, root) ->
    throw err if err
    exec "open #{cfg.repoUrl(root)}"


Config.getUserConfig (err, cfg) ->
  throw err if err

  args = process.argv.slice(2)

  switch args.pop()
    when 'serve'
      serve(cfg)
    else
      open(cfg)



  #gitPath()

  #open url()
