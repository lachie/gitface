(function() {
  var History, LogBuffer, bidirectionalHistory, child_process, commitSummaryRe, getHistory, getRefs, parseCommitSummary, parseRefs, path, util, waterfall, _;
  child_process = require('child_process');
  LogBuffer = require('./log_buffer').LogBuffer;
  _ = require('underscore');
  waterfall = require('async').waterfall;
  path = require('path');
  util = require('util');
  commitSummaryRe = /^\s*(\d+) files changed, (\d+) insertions\(\+\), (\d+) deletions\(-\)\s*$/;
  parseCommitSummary = function(summary) {
    var m;
    if (m = summary != null ? summary.trim().match(commitSummaryRe) : void 0) {
      return {
        files: parseInt(m[1]),
        insertions: parseInt(m[2]),
        deletions: parseInt(m[3])
      };
    } else {
      return {};
    }
  };
  parseRefs = function(summary) {
    if (!summary) {
      return [];
    }
    return summary.trim().slice(1, -1).split(/,\s*/);
  };
  History = (function() {
    function History() {
      this.committers = {};
      this.committerEmails = {};
      this.commits = [];
      this.commitLookup = {};
      this.commitShaIndex = {};
    }
    return History;
  })();
  module.exports.getHistory = getHistory = function(root, callback) {
    var args, commitIndex, format, git, h, logbuffer, options, refs;
    if (_.isFunction(callback)) {
      options = {};
    } else {
      options = callback;
      callback = arguments[2];
    }
    root = root.trim();
    format = '--pretty=format:%H\01%e\01%aN\01%aE\01%cN\01%cE\01%s\01%P\01%at\01%d\01';
    args = ['log', '--date-order', '-z', format, '--parents', '--all', '--shortstat'];
    if (options.limit) {
      args.push("-" + options.limit);
    }
    git = child_process.spawn("git", args, {
      cwd: root
    });
    h = new History;
    console.log(h);
    commitIndex = 0;
    refs = options.refs;
    logbuffer = new LogBuffer;
    logbuffer.on('field', function(data, i) {
      var commit, _base, _base2, _base3;
      commit = (_base = h.commits)[commitIndex] || (_base[commitIndex] = {});
      switch (i) {
        case 0:
          h.commitLookup[data] = commit;
          commit.sha = data;
          if (refs) {
            return commit.refs = refs[commit.sha];
          }
          break;
        case 1:
          return commit.encoding = data;
        case 2:
          commit.author = data;
          (_base2 = h.committers)[data] || (_base2[data] = 0);
          return h.committers[data] += 1;
        case 3:
          return commit.authorEmail = data;
        case 4:
          return commit.comitter = data;
        case 5:
          (_base3 = h.committerEmails)[data] || (_base3[data] = 0);
          h.committerEmails[data] += 1;
          return commit.comitterEmail = data;
        case 6:
          return commit.subject = data;
        case 7:
          return commit.parents = data.split(/\s+/);
        case 8:
          return commit.tv = parseInt(data);
        case 9:
          return commit.refLabels = parseRefs(data);
        case 10:
          return commit.summary = parseCommitSummary(data);
      }
    });
    logbuffer.on('record', function(i) {
      var commit;
      commit = h.commits[commitIndex];
      h.commitShaIndex[commit.sha] = {
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
      return typeof callback == "function" ? callback(h, code === 0) : void 0;
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
  module.exports.bidirectionalHistory = bidirectionalHistory = function(root, outerCallback) {
    var options;
    if (_.isFunction(outerCallback)) {
      options = {};
    } else {
      options = outerCallback;
      outerCallback = arguments[2];
    }
    return getHistory(root, options, function(history, ok) {
      var c, commit, parent, parentCommit, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      _ref = history.commits;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        commit = _ref[_i];
        commit.children || (commit.children = []);
        _ref2 = commit.parents;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          parent = _ref2[_j];
          parentCommit = history.commitLookup[parent];
          if (parentCommit) {
            c = parentCommit.children || (parentCommit.children = []);
            c.push(commit.sha);
          }
        }
      }
      _ref3 = history.commits;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        commit = _ref3[_k];
        if (commit.parents.length > 1) {
          commit.type = 'merge';
        } else if (commit.children.length === 0) {
          commit.type = 'tip';
        } else {
          commit.type = 'commit';
        }
      }
      return outerCallback(history, ok);
    });
  };
  module.exports.abbreviatedHistory = function(root, outerCallback) {
    var options;
    if (_.isFunction(outerCallback)) {
      options = {};
    } else {
      options = outerCallback;
      outerCallback = arguments[2];
    }
    return bidirectionalHistory(root, options, function(result, ok) {});
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
    module.exports.getHistory("" + process.env['HOME'] + "/dev/plus2/davidson", {
      limit: 100
    }, function(err, data) {
      console.log("err", err);
      return console.log("data", data);
    });
  }
}).call(this);
