(function() {
  var app, express, getHistory, getHistoryWithRefs, parallel, _ref;
  parallel = require('async').parallel;
  express = require('express');
  app = module.exports = express.createServer();
  _ref = require('./git'), getHistoryWithRefs = _ref.getHistoryWithRefs, getHistory = _ref.getHistory;
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
    return getHistoryWithRefs({
      limit: 100
    }, function(history, err) {
      return res.render('index', {
        title: "hix",
        commits: history.commits,
        committers: history.committers
      });
    });
  });
  app.get('/commits.json', function(req, res) {
    return getHistoryWithRefs({
      limit: 100
    }, function(history, err) {
      return res.send(history);
    });
  });
  if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
