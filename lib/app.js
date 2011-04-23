(function() {
  var app, express, getHistory;
  express = require('express');
  app = module.exports = express.createServer();
  getHistory = require('./git').getHistory;
  app.configure(function() {
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(__dirname + '/../public'));
  });
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  app.get('/', function(req, res) {
    return getHistory(function(commits, err) {
      return res.render('index', {
        title: "hi",
        commits: commits
      });
    });
  });
  app.get('/commits.json', function(req, res) {
    return getHistory(function(commits, err) {
      return res.send(commits);
    });
  });
  if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
