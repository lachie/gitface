(function() {
  var Config, dump, exec, git, open, serve, util;
  git = require('./git');
  Config = require('./config');
  exec = require('child_process').exec;
  util = require('util');
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
      return git.bidirectionalHistory(root, {
        limit: 100
      }, function(commits, ok) {
        return console.log(util.inspect(commits, false, 3));
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
