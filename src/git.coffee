child_process = require('child_process')
{LogBuffer} = require('./log_buffer')


module.exports.getHistory = (callback, options={}) ->

  format = "--pretty=format:%H\01%e\01%aN\01%cN\01%s\01%P\01%at"

  args = [ 'log', '--date-order', '-z', format, '--children' ]

  if options.limit
    args.push "-#{options.limit}"

  args.push 'HEAD'

  git = child_process.spawn "git", args,
    cwd: "#{process.env['HOME']}/dev/plus2/davidson"

  nameMap =
    'Lachie Cox'              : 'lachie',
    'Ben Askins'              : 'bena',
    'Elle Meredith'           : 'elle',
    'Cameron Barrie'          : 'cam',
    'Glenn Davy'              : 'glenn',
    benwebster                : 'benw',
    'Dylan Fogarty-MacDonald' : 'dylan',
    lachie                    : 'lachie',
    'Brett Goulder'           : 'bgoulder',
    'Matt Allen'              : 'matt',
    mattallen                 : 'matt',
    DylanFM                   : 'dylan'


  commitList = []
  commitIndex = 0

  logbuffer = new LogBuffer

  logbuffer.on 'field', (data, i) ->
    commit = commitList[commitIndex] ||= {}
    switch i
      when 0
        commit.sha = data
      when 1
        commit.encoding = data
      when 2
        commit.author = nameMap[ data ]
      when 3
        commit.comitter = data
      when 4
        commit.subject = data
      when 5
        commit.parents = data.split(/\s+/)
      when 6
        commit.tv = parseInt(data)

  logbuffer.on 'record', (i) ->
    commitIndex += 1

  git.stdout.on 'data', (data) ->
    logbuffer.add data

  git.stderr.on 'data', (data) ->
    console.log('stderr: ' + data)

  git.on 'exit', (code) ->
    logbuffer.finish()
    callback( commitList, code == 0 )
