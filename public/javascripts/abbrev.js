(function() {
  d3.json("/abbrev.json?root=" + window.gitRoot, function(data) {
    var commit, commitLookup, commitString, commits, dateToString, graphWidth, height, i, laneWidth, laneWidth_2, lanes, links, margin, nameTrough, now, radius, symbols, ti, tipLookup, tips, vis, width, x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _results;
    console.log(data);
    margin = 10;
    nameTrough = 50;
    width = $(window).width() - margin * 2;
    graphWidth = 500;
    height = data.commits.length * 32;
    commitLookup = {};
    tipLookup = {};
    tips = [];
    _ref = data.commits;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      commit = _ref[_i];
      commit.tipIndex = tips.length;
      if (commit.type === 'tip') {
        tipLookup[commit.sha] = commit;
        tips.push(commit);
      }
      commitLookup[commit.sha] = commit;
    }
    x = d3.scale.ordinal().domain((function() {
      _results = [];
      for (var _j = 0, _ref2 = tips.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j += 1 : _j -= 1){ _results.push(_j); }
      return _results;
    }).apply(this, arguments)).rangeBands([0, graphWidth], .2);
    y = d3.scale.linear().domain([0, data.commits.length + 1]).range([nameTrough, height + nameTrough]);
    _ref3 = data.commits;
    for (i = 0, _len2 = _ref3.length; i < _len2; i++) {
      commit = _ref3[i];
      switch (commit != null ? commit.type : void 0) {
        case 'tip':
          ti = commit.tipIndex || 0;
          break;
        default:
          ti = ((_ref4 = tipLookup[commit.tipSha]) != null ? _ref4.tipIndex : void 0) || 0;
      }
      commit.x = x(ti);
      commit.y = y(i);
    }
    console.log("tips", tips);
    console.log("commits", data.commits);
    console.log("commitLookup", commitLookup);
    vis = d3.select("body #graph").append("svg:svg").attr("width", width + margin * 2).attr("height", height).append("svg:g").attr("transform", "translate(" + margin + ",0)");
    laneWidth = x(2) - x(1);
    laneWidth_2 = laneWidth / 2;
    lanes = vis.selectAll('g.lane').data(tips).enter().append('svg:g').attr('class', 'lane').attr('transform', function(d, i) {
      return "translate(" + (x(i) - laneWidth_2) + ", 0)";
    }).attr('id', function(d, i) {
      return "lane-" + d;
    });
    lanes.append('svg:rect').attr('fill', 'black').attr('fill-opacity', function(d, i) {
      if (i % 2) {
        return 0.2;
      } else {
        return 0.1;
      }
    }).attr('x', 0).attr('y', 0).attr('width', laneWidth).attr('height', height);
    links = [];
    commits = vis.selectAll('g.commit').data(data.commits).enter().append('svg:g').each(function(commit, i) {
      var link, parent, parentSha, _i, _len, _ref, _results;
      _ref = commit.parents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        parentSha = _ref[_i];
        console.log(commit.parents);
        _results.push((parent = commitLookup[parentSha]) ? (console.log("p", parent), link = {
          x1: commit.x,
          y1: commit.y,
          x2: parent.x,
          y2: parent.y
        }, links.push(link)) : void 0);
      }
      return _results;
    }).attr('class', 'commit').attr("transform", function(d, i) {
      return "translate(0," + d.y + ")";
    });
    radius = 7;
    symbols = {
      tip: d3.svg.symbol().type('square').size(radius * radius),
      merge: d3.svg.symbol().type('triangle-up').size(radius * radius),
      fork: d3.svg.symbol().type('diamond').size(radius * radius),
      commit: d3.svg.symbol().type('circle').size(radius * radius)
    };
    commits.append('svg:path').attr('stroke', 'black').attr('fill', 'none').attr("transform", function(d) {
      return "translate(" + d.x + ", 0)";
    }).attr('d', function(d) {
      return (symbols[d.type] || symbols['commit'])();
    });
    commitString = function(commit) {
      var refs;
      refs = commit.refLabels.join(',');
      return "[" + refs + "] " + commit.author + " - " + commit.subject;
    };
    now = Math.floor(new Date().getTime() / 1000);
    dateToString = function(d) {
      var day, delta;
      delta = now - d.tv;
      day = 3600 * 24;
      if (delta < 3600) {
        return "" + (Math.floor(delta / 60)) + "m";
      } else if (delta < day) {
        return "" + (Math.floor(delta / 3600)) + "h";
      } else {
        return "" + (Math.floor(delta / day)) + "d";
      }
    };
    commits.append('svg:text').text(dateToString).attr('width', 50).attr('alignment-baseline', 'middle').attr('x', graphWidth);
    commits.append('svg:text').attr('alignment-baseline', 'middle').attr('x', graphWidth + 50).text(function(commit, i) {
      var refs, _ref;
      switch (commit.type) {
        case 'tip':
          return commitString(commit);
        case 'commit':
          refs = commit.containsRefs.join(',');
          return "" + (((_ref = commit.contains) != null ? _ref.length : void 0) || 0) + " commits (" + refs + ")";
          break;
        case 'merge':
          return 'merge';
        case 'fork':
          return "fork - " + (commitString(commit));
      }
    });
    return vis.selectAll('line.link').data(links).enter().append('svg:line').attr('class', 'link').attr('stroke', 'black').attr('x1', function(d) {
      return d.x1;
    }).attr('y1', function(d) {
      return d.y1;
    }).attr('x2', function(d) {
      return d.x2;
    }).attr('y2', function(d) {
      return d.y2;
    });
  });
}).call(this);
