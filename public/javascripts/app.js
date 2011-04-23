(function() {
  d3.json("/commits.json", function(data) {
    var commitOffsets, committerReverseIndex, committers, height, links, margin, radius, radius_2, shows, topTop, vis, width, x, y, _i, _j, _ref, _ref2, _results, _results2;
    margin = 10;
    width = $("body #graph").width() - margin * 2;
    height = $("body #commits").height();
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
    topTop = $('#commits table tbody tr#commit-0').offset().top;
    commitOffsets = [];
    $('#commits table tbody tr').each(function() {
      var index, row;
      row = $(this);
      index = row.data('index');
      if (index != null) {
        return commitOffsets[parseInt(index)] = row.offset().top - topTop + (row.height() / 2);
      }
    });
    console.log(commitOffsets);
    x = d3.scale.ordinal().domain((function() {
      _results = [];
      for (var _i = 0, _ref = committers.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i += 1 : _i -= 1){ _results.push(_i); }
      return _results;
    }).apply(this, arguments)).rangeBands([0, width], .2);
    y = d3.scale.ordinal().domain((function() {
      _results2 = [];
      for (var _j = 0, _ref2 = data.commits.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j += 1 : _j -= 1){ _results2.push(_j); }
      return _results2;
    }).apply(this, arguments)).range(commitOffsets);
    $("body #graph").empty();
    vis = d3.select("body #graph").append("svg:svg").attr("width", width + margin * 2).attr("height", height).append("svg:g").attr("transform", "translate(" + margin + ",0)");
    vis.append("svn:rect").attr("stroke", "black").attr("width", width).attr("height", height);
    radius = 6;
    radius_2 = Math.floor(radius / 2);
    links = [];
    shows = vis.selectAll("g.commit").data(data.commits).enter().append("svg:g").each(function(d, i) {
      var from, link, sha, to, _i, _len, _ref, _results;
      from = data.commitShaIndex[d.sha];
      _ref = d.parents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sha = _ref[_i];
        link = {
          x1: committerReverseIndex[from.author],
          y1: from.index
        };
        links.push(link);
        _results.push((to = data.commitShaIndex[sha]) ? (link.x2 = committerReverseIndex[to.author], link.y2 = to.index) : (link.x2 = committerReverseIndex[from.author], link.y2 = data.commits.length - 1));
      }
      return _results;
    }).attr('class', 'commit').attr("transform", function(d, i) {
      var xi;
      xi = committerReverseIndex[d.author];
      return "translate(" + (x(xi)) + "," + (y(i)) + ")";
    });
    shows.append('svg:rect').attr("x", -radius_2).attr("y", -radius_2).attr("width", radius).attr("height", radius);
    return vis.selectAll('line.link').data(links).enter().append('svg:line').attr('class', 'link').attr('x1', function(d) {
      return x(d.x1);
    }).attr('y1', function(d) {
      return y(d.y1);
    }).attr('x2', function(d) {
      return x(d.x2);
    }).attr('y2', function(d) {
      return y(d.y2);
    });
  });
}).call(this);
