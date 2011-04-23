d3.json "/commits.json", (data) ->
  margin = 10

  width  = $("body #graph").width() - margin*2
  height = $("body #commits").height()

  committerReverseIndex = {}

  committers = _.map( data.committers, (count, name) -> [count, name] )
  committers = _.sortBy( committers  , (c) -> -c[0] )
  committers = _.map(committers     , (c,i) -> committerReverseIndex[c[1]] = i; c[1])

  topTop = $('#commits table tbody tr#commit-0').offset().top

  commitOffsets = []
  $('#commits table tbody tr').each ->
    row = $(@)

    index = row.data('index')
    if index?
      commitOffsets[parseInt(index)] = row.offset().top - topTop + (row.height()/2)

  console.log commitOffsets

  x = d3.scale.ordinal().domain([0...committers.length  ]).rangeBands([0, width], .2)
  y = d3.scale.ordinal().domain([0...data.commits.length]).range(commitOffsets)

  $("body #graph").empty()

  vis = d3.select("body #graph")
  .append("svg:svg")
  .attr("width" , width  + margin*2)
  .attr("height", height)
  .append("svg:g")
  .attr("transform", "translate(#{margin},0)")

  vis.append("svn:rect")
    .attr("stroke", "black")
    .attr("width", width)
    .attr("height", height)

  radius = 6
  radius_2 = Math.floor(radius/2)

  links = []
  shows = vis.selectAll("g.commit")
              .data(data.commits)
              .enter().append("svg:g")

            .each( (d,i) ->
              from = data.commitShaIndex[ d.sha ]

              for sha in d.parents
                link = x1: committerReverseIndex[from.author], y1: from.index
                links.push link

                if to = data.commitShaIndex[ sha ]
                  link.x2 = committerReverseIndex[to.author]
                  link.y2 = to.index
                else
                  link.x2 = committerReverseIndex[from.author]
                  link.y2 = data.commits.length-1

            )
            .attr('class', 'commit')
            .attr("transform", (d, i) ->
              xi = committerReverseIndex[d.author]
              "translate(#{x(xi)},#{y(i)})"
            )


  shows.append('svg:rect')
       .attr("x", -radius_2)
       .attr("y", -radius_2)
       .attr("width"  , radius)
       .attr("height" , radius)


  vis.selectAll('line.link')
      .data(links)
      .enter().append('svg:line')
      .attr('class', 'link')
      .attr('x1', (d) -> x(d.x1))
      .attr('y1', (d) -> y(d.y1))
      .attr('x2', (d) -> x(d.x2))
      .attr('y2', (d) -> y(d.y2))
