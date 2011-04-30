child_process = require('child_process')
{LogBuffer} = require('./log_buffer')
_ = require('underscore')
{waterfall} = require('async')
path = require('path')


module.exports.getHistory = getHistory = (root, callback) ->

  if _.isFunction callback
    options = {}
  else
    options = callback
    callback = arguments[2]

  format = "--pretty=format:%H\01%e\01%aN\01%cN\01%s\01%P\01%at"

  args = [ 'log', '--date-order', '-z', format, '--children', '--all' ]

  if options.limit
    args.push "-#{options.limit}"

  # args.push 'HEAD'

  git = child_process.spawn "git", args,
    cwd: root

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

  committers = {}
  commitList = []
  commitIndex = 0

  commitReverseIndex = {}

  refs = options.refs

  logbuffer = new LogBuffer

  logbuffer.on 'field', (data, i) ->
    commit = commitList[commitIndex] ||= {}
    switch i
      when 0
        commit.sha = data
        if refs
          commit.refs = refs[commit.sha]
      when 1
        commit.encoding = data
      when 2
        commit.author = author = nameMap[ data ]
        committers[author] ||= 0
        committers[author] +=  1

      when 3
        commit.comitter = data
      when 4
        commit.subject = data
      when 5
        commit.parents = data.split(/\s+/)
      when 6
        commit.tv = parseInt(data)

  logbuffer.on 'record', (i) ->
    commit = commitList[commitIndex]
    commitReverseIndex[commit.sha] = index: commitIndex, author: commit.author

    commitIndex += 1

  git.stdout.on 'data', (data) ->
    logbuffer.add data

  git.stderr.on 'data', (data) ->
    console.log('stderr: ' + data)

  git.on 'exit', (code) ->
    logbuffer.finish()
    callback?( {commits: commitList, committers: committers, commitShaIndex: commitReverseIndex}, code == 0 )





module.exports.getRefs = getRefs = (root, callback) ->

  if _.isFunction callback
    options = {}
  else
    options = callback
    callback = arguments[2]

  args = ['show-ref', '--dereference']

  git = child_process.spawn "git", args,
    cwd: root

  refs = {}
  currentKey = null



  logbuffer = new LogBuffer fieldSep: 0x20, recordSep: 0x0a

  refRe = /^refs\/([^\/]+)\/(.*)$/

  refTypeMap =
    remotes: 'remote'
    tags: 'tag'
    heads: 'head'


  logbuffer.on 'field', (data, i) ->
    switch i
      when 0
        currentKey = data
      when 1
        if m = data.match(refRe)
          ref = ref: m[2], type: (refTypeMap[m[1]] || m[1])
        else
          ref = ref: data

        currentRefs = refs[currentKey] ||= []
        currentRefs.push ref
        currentKey = null



  logbuffer.on 'record', (i) ->


  git.stdout.on 'data', (data) ->
    logbuffer.add data

  git.stderr.on 'data', (data) ->
    console.log('stderr: ' + data)

  git.on 'exit', (code) ->
    logbuffer.finish()
    callback?( {refs: refs}, code == 0 )


module.exports.getHistoryWithRefs = (root, outerCallback) ->
  if _.isFunction outerCallback
    options = {}
  else
    options = outerCallback
    outerCallback = arguments[2]

  waterfall [
    (callback) ->
      getRefs root, (data, err) ->
        callback(null, data)

    (data, callback) ->
      historyOptions = refs: data.refs, limit: options.limit

      getHistory root, historyOptions, (data, err) ->
        callback(null, data)

    (data, callback) ->
      outerCallback(data)
  ]


module.exports.dotGit = (cwd, callback) ->
  unless callback?
    callback = cwd
    cwd = process.cwd()

  args = ["rev-parse", "--git-dir"]
  git = child_process.spawn "git", args,
    cwd: cwd

  gitPath = ""
  error = ""

  git.stdout.on 'data', (data) ->
    gitPath += data.toString()

  git.stderr.on 'data', (data) ->
    error += data.toString()

  git.on 'exit', (code) ->
    if code == 0
      callback?( null, path.resolve(cwd, gitPath) )
    else
      callback?( "in #{cwd}\n#{error}" )


unless module.parent?
  module.exports.dotGit "#{process.env['HOME']}/dev/plus2", (err, data) ->
    console.log "err", err
    console.log "data", data

