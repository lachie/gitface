(function() {
  var abbreviatedHistory, app, express, getHistory, getHistoryWithRefs, parallel, _ref;
  parallel = require('async').parallel;
  express = require('express');
  app = module.exports = express.createServer();
  _ref = require('./git'), getHistoryWithRefs = _ref.getHistoryWithRefs, getHistory = _ref.getHistory, abbreviatedHistory = _ref.abbreviatedHistory;
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
  app.get('/r', function(req, res) {
    return getHistoryWithRefs(req.query.root, {
      limit: 100
    }, function(history, err) {
      return res.render('index', {
        title: "gitface",
        gitRoot: req.query.root,
        script: "app",
        commits: history.commits,
        committers: history.committers
      });
    });
  });
  app.get('/a', function(req, res) {
    return res.render('abbrev', {
      title: "gitface",
      script: "abbrev",
      gitRoot: req.query.root
    });
  });
  app.get('/', function(req, res) {});
  app.get('/commits.json', function(req, res) {
    return getHistoryWithRefs(req.query.root, {
      limit: 100
    }, function(history, err) {
      return res.send(history);
    });
  });
  app.get('/abbrev.json', function(req, res) {
    console.log("abbrev", req.query.root);
    return abbreviatedHistory(req.query.root, {
      limit: 1000
    }, function(history, err) {
      return res.send(history);
    });
  });
  if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
