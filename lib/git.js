(function() {
  var LogBuffer, child_process, getHistory, getRefs, path, waterfall, _;
  child_process = require('child_process');
  LogBuffer = require('./log_buffer').LogBuffer;
  _ = require('underscore');
  waterfall = require('async').waterfall;
  path = require('path');
  module.exports.getHistory = getHistory = function(root, callback) {
    var args, commitIndex, commitList, commitReverseIndex, committers, format, git, logbuffer, nameMap, options, refs;
    if (_.isFunction(callback)) {
      options = {};
    } else {
      options = callback;
      callback = arguments[2];
    }
    format = "--pretty=format:%H\01%e\01%aN\01%cN\01%s\01%P\01%at";
    args = ['log', '--date-order', '-z', format, '--children', '--all'];
    if (options.limit) {
      args.push("-" + options.limit);
    }
    git = child_process.spawn("git", args, {
      cwd: root
    });
    nameMap = {
      'Lachie Cox': 'lachie',
      'Ben Askins': 'bena',
      'Elle Meredith': 'elle',
      'Cameron Barrie': 'cam',
      'Glenn Davy': 'glenn',
      benwebster: 'benw',
      'Dylan Fogarty-MacDonald': 'dylan',
      lachie: 'lachie',
      'Brett Goulder': 'bgoulder',
      'Matt Allen': 'matt',
      mattallen: 'matt',
      DylanFM: 'dylan'
    };
    committers = {};
    commitList = [];
    commitIndex = 0;
    commitReverseIndex = {};
    refs = options.refs;
    logbuffer = new LogBuffer;
    logbuffer.on('field', function(data, i) {
      var author, commit;
      commit = commitList[commitIndex] || (commitList[commitIndex] = {});
      switch (i) {
        case 0:
          commit.sha = data;
          if (refs) {
            return commit.refs = refs[commit.sha];
          }
          break;
        case 1:
          return commit.encoding = data;
        case 2:
          commit.author = author = nameMap[data];
          committers[author] || (committers[author] = 0);
          return committers[author] += 1;
        case 3:
          return commit.comitter = data;
        case 4:
          return commit.subject = data;
        case 5:
          return commit.parents = data.split(/\s+/);
        case 6:
          return commit.tv = parseInt(data);
      }
    });
    logbuffer.on('record', function(i) {
      var commit;
      commit = commitList[commitIndex];
      commitReverseIndex[commit.sha] = {
        index: commitIndex,
        author: commit.author
      };
      return commitIndex += 1;
    });
    git.stdout.on('data', function(data) {
      return logbuffer.add(data);
    });
    git.stderr.on('data', function(data) {
      return console.log('stderr: ' + data);
    });
    return git.on('exit', function(code) {
      logbuffer.finish();
      return typeof callback == "function" ? callback({
        commits: commitList,
        committers: committers,
        commitShaIndex: commitReverseIndex
      }, code === 0) : void 0;
    });
  };
  module.exports.getRefs = getRefs = function(root, callback) {
    var args, currentKey, git, logbuffer, options, refRe, refTypeMap, refs;
    if (_.isFunction(callback)) {
      options = {};
    } else {
      options = callback;
      callback = arguments[2];
    }
    args = ['show-ref', '--dereference'];
    git = child_process.spawn("git", args, {
      cwd: root
    });
    refs = {};
    currentKey = null;
    logbuffer = new LogBuffer({
      fieldSep: 0x20,
      recordSep: 0x0a
    });
    refRe = /^refs\/([^\/]+)\/(.*)$/;
    refTypeMap = {
      remotes: 'remote',
      tags: 'tag',
      heads: 'head'
    };
    logbuffer.on('field', function(data, i) {
      var currentRefs, m, ref;
      switch (i) {
        case 0:
          return currentKey = data;
        case 1:
          if (m = data.match(refRe)) {
            ref = {
              ref: m[2],
              type: refTypeMap[m[1]] || m[1]
            };
          } else {
            ref = {
              ref: data
            };
          }
          currentRefs = refs[currentKey] || (refs[currentKey] = []);
          currentRefs.push(ref);
          return currentKey = null;
      }
    });
    logbuffer.on('record', function(i) {});
    git.stdout.on('data', function(data) {
      return logbuffer.add(data);
    });
    git.stderr.on('data', function(data) {
      return console.log('stderr: ' + data);
    });
    return git.on('exit', function(code) {
      logbuffer.finish();
      return typeof callback == "function" ? callback({
        refs: refs
      }, code === 0) : void 0;
    });
  };
  module.exports.getHistoryWithRefs = function(root, outerCallback) {
    var options;
    if (_.isFunction(outerCallback)) {
      options = {};
    } else {
      options = outerCallback;
      outerCallback = arguments[2];
    }
    return waterfall([
      function(callback) {
        return getRefs(root, function(data, err) {
          return callback(null, data);
        });
      }, function(data, callback) {
        var historyOptions;
        historyOptions = {
          refs: data.refs,
          limit: options.limit
        };
        return getHistory(root, historyOptions, function(data, err) {
          return callback(null, data);
        });
      }, function(data, callback) {
        return outerCallback(data);
      }
    ]);
  };
  module.exports.dotGit = function(cwd, callback) {
    var args, error, git, gitPath;
    if (callback == null) {
      callback = cwd;
      cwd = process.cwd();
    }
    args = ["rev-parse", "--git-dir"];
    git = child_process.spawn("git", args, {
      cwd: cwd
    });
    gitPath = "";
    error = "";
    git.stdout.on('data', function(data) {
      return gitPath += data.toString();
    });
    git.stderr.on('data', function(data) {
      return error += data.toString();
    });
    return git.on('exit', function(code) {
      if (code === 0) {
        return typeof callback == "function" ? callback(null, path.resolve(cwd, gitPath)) : void 0;
      } else {
        return typeof callback == "function" ? callback("in " + cwd + "\n" + error) : void 0;
      }
    });
  };
  if (module.parent == null) {
    module.exports.dotGit("" + process.env['HOME'] + "/dev/plus2", function(err, data) {
      console.log("err", err);
      return console.log("data", data);
    });
  }
}).call(this);
