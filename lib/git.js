(function() {
  var LogBuffer, child_process, _;
  child_process = require('child_process');
  LogBuffer = require('./log_buffer').LogBuffer;
  _ = require('underscore');
  module.exports.getHistory = function(callback) {
    var args, commitIndex, commitList, commitReverseIndex, committers, format, git, logbuffer, nameMap, options;
    if (_.isFunction(callback)) {
      options = {};
    } else {
      options = callback;
      callback = arguments[1];
    }
    format = "--pretty=format:%H\01%e\01%aN\01%cN\01%s\01%P\01%at";
    args = ['log', '--date-order', '-z', format, '--children'];
    if (options.limit) {
      args.push("-" + options.limit);
    }
    args.push('HEAD');
    git = child_process.spawn("git", args, {
      cwd: "" + process.env['HOME'] + "/dev/plus2/davidson"
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
    logbuffer = new LogBuffer;
    logbuffer.on('field', function(data, i) {
      var author, commit;
      commit = commitList[commitIndex] || (commitList[commitIndex] = {});
      switch (i) {
        case 0:
          return commit.sha = data;
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
}).call(this);
