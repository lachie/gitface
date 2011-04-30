(function() {
  var Config, exec, git, open, serve;
  git = require('./git');
  Config = require('./config');
  exec = require('child_process').exec;
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
  Config.getUserConfig(function(err, cfg) {
    var args;
    if (err) {
      throw err;
    }
    args = process.argv.slice(2);
    switch (args.pop()) {
      case 'serve':
        return serve(cfg);
      default:
        return open(cfg);
    }
  });
}).call(this);
