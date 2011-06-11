(function() {
  var Config, fs, path;
  fs = require("fs");
  path = require("path");
  module.exports = Config = (function() {
    Config.userConfigurationPath = path.join(process.env['HOME'], ".gitfacerc");
    Config.evalConfig = function(path, callback) {
      return fs.readFile(path, 'utf8', function(err, data) {
        var config;
        if (err) {
          throw err;
        }
        config = new Function("return " + data)();
        return callback(null, config);
      });
    };
    Config.loadUserConfig = function(callback) {
      var p;
      return path.exists(p = this.userConfigurationPath, function(exists) {
        if (exists) {
          return Config.evalConfig(p, callback);
        } else {
          return callback(null, {});
        }
      });
    };
    Config.getUserConfig = function(callback) {
      return this.loadUserConfig(function(err, data) {
        if (err) {
          return callback(err);
        } else {
          return callback(null, new Config(data));
        }
      });
    };
    function Config(options) {
      if (options == null) {
        options = {};
      }
      this.port = options.port || 3000;
    }
    Config.prototype.baseUrl = function() {
      return "http://localhost:" + this.port + "/";
    };
    Config.prototype.repoUrl = function(root) {
      return this.baseUrl() + ("r?root=" + root);
    };
    return Config;
  })();
  if (module.parent == null) {
    Config.getUserConfig(function(err, cfg) {
      if (err) {
        throw err;
      }
      return console.log("loadedConfig:", cfg.port);
    });
  }
}).call(this);
