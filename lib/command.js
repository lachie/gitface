(function() {
  var Config, dump, exec, git, open, serve, util, _;
  git = require('./git');
  Config = require('./config');
  exec = require('child_process').exec;
  util = require('util');
  _ = require('underscore');
  serve = function(cfg) {
    var app;
    app = require('./app');
    app.listen(cfg.port);
    return console.log("Gitface server listening on port %d ... come visit on " + (cfg.baseUrl()), app.address().port);
  };
  open = function(cfg) {
    return git.dotGit(function(err, root) {
      if (err) {
        throw err;
      }
      return exec("open " + (cfg.repoUrl(root)));
    });
  };
  dump = function(cfg) {
    return git.dotGit(function(err, root) {
      if (err != null) {
        throw err;
      }
      return git.abbreviatedHistory(root, {
        limit: 100
      }, function(history, ok) {
        return console.log(history.commits);
      });
    });
  };
  Config.getUserConfig(function(err, cfg) {
    var args;
    if (err != null) {
      throw err;
    }
    args = process.argv.slice(2);
    switch (args.pop()) {
      case 'serve':
        return serve(cfg);
      case 'dump':
        return dump(cfg);
      default:
        return open(cfg);
    }
  });
}).call(this);
