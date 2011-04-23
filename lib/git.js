(function() {
  var LogBuffer, child_process;
  child_process = require('child_process');
  LogBuffer = require('./log_buffer').LogBuffer;
  module.exports.getHistory = function(callback, options) {
    var args, commitIndex, commitList, format, git, logbuffer, nameMap;
    if (options == null) {
      options = {};
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
    commitList = [];
    commitIndex = 0;
    logbuffer = new LogBuffer;
    logbuffer.on('field', function(data, i) {
      var commit;
      commit = commitList[commitIndex] || (commitList[commitIndex] = {});
      switch (i) {
        case 0:
          return commit.sha = data;
        case 1:
          return commit.encoding = data;
        case 2:
          return commit.author = nameMap[data];
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
      return callback(commitList, code === 0);
    });
  };
}).call(this);
