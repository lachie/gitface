# Module dependencies.

express = require('express')
app = module.exports = express.createServer()

{getHistory} = require('./git')

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

app.get '/', (req, res) ->
  getHistory (commits, err) ->
    res.render 'index'
      title: "hi"
      commits: commits

app.get '/commits.json', (req, res) ->
  getHistory (commits, err) ->
    res.send(commits)

# Only listen on $ node app.js

if (!module.parent)
  app.listen(3000)
  console.log("Express server listening on port %d", app.address().port)
