d3.json "/commits.json?root=#{window.gitRoot}", (data) ->
  margin = 10
  nameTrough = 50

  width  = $(window).width() - margin*2
  graphWidth = 200
  height = data.commits.length * 32

  committerReverseIndex = {}

  committers = _.map( data.committers, (count, name) -> [count, name] )
  committers = _.sortBy( committers  , (c) -> -c[0] )
  committers = _.map(committers     , (c,i) -> committerReverseIndex[c[1]] = i; c[1])

  x = d3.scale.ordinal().domain([0...committers.length  ]).rangeBands([0, graphWidth], .2)
  y = d3.scale.linear().domain([0,data.commits.length+1 ]).range([nameTrough,height+nameTrough])

  $("body #graph").empty()

  vis = d3.select("body #graph")
  .append("svg:svg")
  .attr("width" , width  + margin*2)
  .attr("height", height)
  .append("svg:g")
  .attr("transform", "translate(#{margin},0)")

  vis.append('svn:line')
    .attr("stroke", "black")
    .attr('x1',0)
    .attr('y1',nameTrough)
    .attr('x2',graphWidth)
    .attr('y2',nameTrough)

  vis.append("svn:rect")
    .attr("stroke", "black")
    .attr("width", width)
    .attr("height", height)


  # lanes

  laneWidth = x(2) - x(1)
  laneWidth_2 = laneWidth / 2

  lanes = vis.selectAll('g.lane')
     .data(committers)
     .enter().append('svg:g')
     .attr('class','lane')
     .attr('transform', (d,i) -> "translate(#{x(i)-laneWidth_2}, 0)") #"
     .attr('id', (d, i) -> "lane-#{d}")

  lanes.append('svg:rect')
     .attr('fill','black')
     .attr('fill-opacity',(d,i) -> if i%2 then 0.2 else 0.1)
     .attr('x', 0)
     .attr('y', 0)
     .attr('width', laneWidth)
     .attr('height', height)

  names = lanes.append('svg:text')
            .attr('class', 'name')
            .attr('fill-opacity', 0.5)
            .attr('y', -laneWidth_2)
            .attr('x', 0)
            .text((d) -> d)
            .attr('alignment-baseline', 'middle')
            .attr('transform', 'rotate(90)')


  # commits
  commitHeight = x(2) - x(1)
  commitHeight_2 = commitHeight / 2

  radius = 3

  links = []
  commits = vis.selectAll("g.commit")
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
            .attr('width', width)
            .attr("transform", (d, i) -> "translate(0,#{y(i)})")
            .on( 'mouseover', (d, i) ->
              $("#lane-#{d.author}").attr('class', 'lane highlighted')
              $("#lane-#{d.author} rect").attr('fill', 'red')
              $("#hi-#{i}").attr('visibility', 'visible')
            )
            .on( 'mouseout', (d, i) ->
              $("#lane-#{d.author}").attr('class', 'lane')
              $("#lane-#{d.author} rect").attr('fill', 'black')
              $("#hi-#{i}").attr('visibility', 'hidden')
            )


  commit = commits.append('svg:g')
             .attr('transform', (d, i) -> "translate(#{x(committerReverseIndex[d.author])},0)") #"

  commit.append('svg:circle')
           .attr('stroke','black')
           .attr('fill','none')
           .attr("cx", 0)
           .attr("cy", 0)
           .attr("r"  , radius)

  commit.append('svg:text')
        .attr('alignment-baseline', 'middle')
        .attr('x', 10)
        .attr('font-size', '75%')
        .attr('opacity', 0.5)
        .attr('transform', 'rotate(30)')
        .text((d,i) ->
          # ref.type
          _.map( d.refs, (ref) -> ref.ref ).join(',')
        )


  now = Math.floor( new Date().getTime() / 1000 )
  dateToString = (d) ->
    delta = (now-d.tv)
    day   = 3600*24

    if delta < 3600
      "#{Math.floor delta / 60}m"
    else if delta < day
      "#{Math.floor delta / 3600}h"
    else
      "#{Math.floor delta / day}d"

  commits.append('svg:text')
    .text(dateToString)
    .attr('width', 50)
    .attr('alignment-baseline', 'middle')
    .attr('x', graphWidth)


  commits.append('svg:text')
    .text( (d, i) -> d.subject )
    .attr('width', 200)
    .attr('alignment-baseline', 'middle')
    .attr('x', graphWidth+50)


  commits.append('svg:rect')
    .attr('id', (d, i) -> "hi-#{i}")
    .attr('visibility', 'hidden')
    .attr('fill', 'red')
    .attr('opacity', 0.25)
    .attr('y', -commitHeight_2)
    .attr('width', width)
    .attr('height', commitHeight)

  vis.selectAll('line.link')
      .data(links)
      .enter().append('svg:line')
      .attr('class', 'link')
      .attr('stroke','black')
      .attr('x1', (d) -> x(d.x1))
      .attr('y1', (d) -> y(d.y1))
      .attr('x2', (d) -> x(d.x2))
      .attr('y2', (d) -> y(d.y2))


  graph = $('#graph')
  top = graph.offset().top
  names = $('g.lane text.name')

  $(window).scroll $.throttle 100, (e) ->
      graphTop = $(e.target).scrollTop()-top
      graphTop = 0 if graphTop < 0
      d3.selectAll("text.name").transition().attr('x', graphTop+10)
