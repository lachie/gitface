(function() {
  d3.json("/commits.json?root=" + window.gitRoot, function(data) {
    var changeRadius, commit, commitHeight, commitHeight_2, commits, committerReverseIndex, committers, dateToString, graph, graphWidth, height, laneWidth, laneWidth_2, lanes, links, margin, maxChanges, minChanges, nameTrough, names, now, top, vis, width, x, y, _i, _ref, _results;
    margin = 10;
    nameTrough = 50;
    width = $(window).width() - margin * 2;
    graphWidth = 200;
    height = data.commits.length * 32;
    committerReverseIndex = {};
    committers = _.map(data.committers, function(count, name) {
      return [count, name];
    });
    committers = _.sortBy(committers, function(c) {
      return -c[0];
    });
    committers = _.map(committers, function(c, i) {
      committerReverseIndex[c[1]] = i;
      return c[1];
    });
    x = d3.scale.ordinal().domain((function() {
      _results = [];
      for (var _i = 0, _ref = committers.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i += 1 : _i -= 1){ _results.push(_i); }
      return _results;
    }).apply(this, arguments)).rangeBands([0, graphWidth], .2);
    y = d3.scale.linear().domain([0, data.commits.length + 1]).range([nameTrough, height + nameTrough]);
    $("body #graph").empty();
    vis = d3.select("body #graph").append("svg:svg").attr("width", width + margin * 2).attr("height", height).append("svg:g").attr("transform", "translate(" + margin + ",0)");
    vis.append('svn:line').attr("stroke", "black").attr('x1', 0).attr('y1', nameTrough).attr('x2', graphWidth).attr('y2', nameTrough);
    vis.append("svn:rect").attr("stroke", "black").attr("width", width).attr("height", height);
    laneWidth = x(2) - x(1);
    laneWidth_2 = laneWidth / 2;
    lanes = vis.selectAll('g.lane').data(committers).enter().append('svg:g').attr('class', 'lane').attr('transform', function(d, i) {
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
    names = lanes.append('svg:text').attr('class', 'name').attr('fill-opacity', 0.5).attr('y', -laneWidth_2).attr('x', 0).text(function(d) {
      return d;
    }).attr('alignment-baseline', 'middle').attr('transform', 'rotate(90)');
    commitHeight = x(2) - x(1);
    commitHeight_2 = commitHeight / 2;
    maxChanges = 0;
    minChanges = 9999;
    links = [];
    commits = vis.selectAll("g.commit").data(data.commits).enter().append("svg:g").each(function(d, i) {
      var from, link, s, sha, to, _i, _len, _ref, _ref2, _ref3, _results;
      if (s = d.summary) {
        d.changes = ((_ref = s.insertions) != null ? _ref : 0) + ((_ref2 = s.deletions) != null ? _ref2 : 0);
      } else {
        d.changes = 0;
      }
      maxChanges = Math.max(maxChanges, d.changes);
      minChanges = Math.min(minChanges, d.changes);
      from = data.commitShaIndex[d.sha];
      _ref3 = d.parents;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        sha = _ref3[_i];
        link = {
          x1: committerReverseIndex[from.author],
          y1: from.index
        };
        links.push(link);
        _results.push((to = data.commitShaIndex[sha]) ? (link.x2 = committerReverseIndex[to.author], link.y2 = to.index) : (link.x2 = committerReverseIndex[from.author], link.y2 = data.commits.length - 1));
      }
      return _results;
    }).attr('class', 'commit').attr('width', width).attr("transform", function(d, i) {
      return "translate(0," + (y(i)) + ")";
    }).on('mouseover', function(d, i) {
      $("#lane-" + d.author).attr('class', 'lane highlighted');
      $("#lane-" + d.author + " rect").attr('fill', 'red');
      return $("#hi-" + i).attr('visibility', 'visible');
    }).on('mouseout', function(d, i) {
      $("#lane-" + d.author).attr('class', 'lane');
      $("#lane-" + d.author + " rect").attr('fill', 'black');
      return $("#hi-" + i).attr('visibility', 'hidden');
    });
    changeRadius = d3.scale.linear().domain([minChanges, maxChanges]).range([2, 10]);
    commit = commits.append('svg:g').attr('transform', function(d, i) {
      return "translate(" + (x(committerReverseIndex[d.author])) + ",0)";
    });
    commit.append('svg:circle').attr('stroke', 'black').attr('fill', 'none').attr("cx", 0).attr("cy", 0).attr("r", function(d, i) {
      return changeRadius(d.changes);
    });
    commit.append('svg:text').attr('alignment-baseline', 'middle').attr('x', 10).attr('font-size', '75%').attr('opacity', 0.5).attr('transform', 'rotate(30)').text(function(d, i) {
      return _.map(d.refs, function(ref) {
        return ref.ref;
      }).join(',');
    });
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
    commits.append('svg:text').text(function(d, i) {
      return d.subject;
    }).attr('width', 200).attr('alignment-baseline', 'middle').attr('x', graphWidth + 50);
    commits.append('svg:rect').attr('id', function(d, i) {
      return "hi-" + i;
    }).attr('visibility', 'hidden').attr('fill', 'red').attr('opacity', 0.25).attr('y', -commitHeight_2).attr('width', width).attr('height', commitHeight);
    vis.selectAll('line.link').data(links).enter().append('svg:line').attr('class', 'link').attr('stroke', 'black').attr('x1', function(d) {
      return x(d.x1);
    }).attr('y1', function(d) {
      return y(d.y1);
    }).attr('x2', function(d) {
      return x(d.x2);
    }).attr('y2', function(d) {
      return y(d.y2);
    });
    graph = $('#graph');
    top = graph.offset().top;
    names = $('g.lane text.name');
    return $(window).scroll($.throttle(100, function(e) {
      var graphTop;
      graphTop = $(e.target).scrollTop() - top;
      if (graphTop < 0) {
        graphTop = 0;
      }
      return d3.selectAll("text.name").transition().attr('x', graphTop + 10);
    }));
  });
}).call(this);
