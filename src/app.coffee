# Module dependencies.

{parallel} = require('async')
express = require('express')
app = module.exports = express.createServer()


{getHistoryWithRefs, getHistory, abbreviatedHistory} = require('./git')

# Configuration

app.configure ->
  app.set 'views', __dirname + '/../views'
  app.set 'view engine', 'jade'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname + '/../public')


app.configure 'development', ->
  app.use(express.errorHandler( dumpExceptions: true, showStack: true ))

app.configure 'production', ->
  app.use(express.errorHandler())

# Routes

app.get '/r', (req, res) ->
  getHistoryWithRefs req.query.root, limit: 100, (history, err) ->
    res.render 'index'
      title: "gitface"
      gitRoot: req.query.root
      script: "app"
      commits: history.commits
      committers: history.committers


app.get '/a', (req, res) ->
  res.render 'abbrev'
    title: "gitface"
    script: "abbrev"
    gitRoot: req.query.root


app.get '/', (req, res) ->

app.get '/commits.json', (req, res) ->
  getHistoryWithRefs req.query.root, limit: 100, (history, err) ->
    res.send(history)


app.get '/abbrev.json', (req, res) ->
  console.log "abbrev", req.query.root
  abbreviatedHistory req.query.root, limit: 1000, (history, err) ->
    res.send(history)

# Only listen on $ node app.js

if (!module.parent)
  app.listen(3000)
  console.log("Express server listening on port %d", app.address().port)
