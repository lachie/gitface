d3.json "/abbrev.json?root=#{window.gitRoot}", (data) ->
  console.log data

  margin = 10
  nameTrough = 50

  width  = $(window).width() - margin*2
  graphWidth = 500
  height = data.commits.length * 32

  commitLookup = {}
  tipLookup = {}
  tips = []

  for commit in data.commits
    commit.tipIndex = tips.length

    if commit.type == 'tip'
      tipLookup[ commit.sha    ] = commit
      tips.push commit

    commitLookup[ commit.sha ] = commit



  x = d3.scale.ordinal().domain([0...tips.length  ]).rangeBands([0, graphWidth], .2)
  y = d3.scale.linear().domain([0,data.commits.length+1 ]).range([nameTrough,height+nameTrough])


  for commit,i in data.commits
    switch commit?.type
      when 'tip'
        ti = commit.tipIndex || 0
      else
        ti = tipLookup[commit.tipSha]?.tipIndex || 0

    commit.x = x(ti)
    commit.y = y(i)


  console.log "tips", tips
  console.log "commits", data.commits
  console.log "commitLookup", commitLookup


  vis = d3.select("body #graph")
    .append("svg:svg")
    .attr("width" , width  + margin*2)
    .attr("height", height)
    .append("svg:g")
    .attr("transform", "translate(#{margin},0)")


  laneWidth = x(2) - x(1)
  laneWidth_2 = laneWidth / 2

  lanes = vis.selectAll('g.lane')
     .data(tips)
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


  links = []
  commits = vis.selectAll('g.commit')
               .data(data.commits)
               .enter().append('svg:g')
               .each((commit,i) ->
                 for parentSha in commit.parents
                   console.log commit.parents
                   if parent = commitLookup[parentSha]
                     console.log "p", parent

                     link = x1: commit.x, y1: commit.y, x2: parent.x, y2: parent.y
                     links.push link

               )
               .attr('class','commit')
               .attr("transform", (d, i) ->
                     "translate(0,#{d.y})"
               )

    radius = 7
    symbols =
      tip: d3.svg.symbol().type('square').size(radius*radius)
      merge: d3.svg.symbol().type('triangle-up').size(radius*radius)
      fork: d3.svg.symbol().type('diamond').size(radius*radius)
      commit: d3.svg.symbol().type('circle').size(radius*radius)

    commits.append('svg:path')
           .attr('stroke','black')
           .attr('fill','none')
           .attr("transform", (d) -> "translate(#{d.x}, 0)")
           .attr('d', (d) ->
             (symbols[d.type] || symbols['commit'])()
           )

    commitString = (commit) ->
      refs = commit.refLabels.join(',')
      "[#{refs}] #{commit.author} - #{commit.subject}"

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
           .attr('alignment-baseline', 'middle')
           .attr('x', graphWidth+50)
           .text((commit,i) ->
             switch commit.type
               when 'tip'
                 commitString(commit)
               when 'commit'
                 refs = commit.containsRefs.join(',')
                 "#{commit.contains?.length || 0} commits (#{refs})"
               when 'merge'
                 'merge'
               when 'fork'
                 "fork - #{commitString(commit)}"
            )

     vis.selectAll('line.link')
      .data(links)
      .enter().append('svg:line')
      .attr('class', 'link')
      .attr('stroke','black')
      .attr('x1', (d) -> d.x1)
      .attr('y1', (d) -> d.y1)
      .attr('x2', (d) -> d.x2)
      .attr('y2', (d) -> d.y2)
