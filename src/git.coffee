child_process = require('child_process')
{LogBuffer} = require('./log_buffer')
_ = require('underscore')
{waterfall} = require('async')
path = require('path')


# 1 files changed, 0 insertions(+), 5 deletions(-)
commitSummaryRe = /^\s*(\d+) files changed, (\d+) insertions\(\+\), (\d+) deletions\(-\)\s*$/
parseCommitSummary = (summary) ->
  if m = summary?.match(commitSummaryRe)
    files     : parseInt(m[1]),
    insertions: parseInt(m[2]),
    deletions : parseInt(m[3])
  else
    {}

module.exports.getHistory = getHistory = (root, callback) ->

  if _.isFunction callback
    options = {}
  else
    options = callback
    callback = arguments[2]

  format = "--pretty=format:%H\01%e\01%aN\01%aE\01%cN\01%cE\01%s\01%P\01%at"

  args = [ 'log', '--date-order', '-z', format, '--children', '--all', '--shortstat' ]

  if options.limit
    args.push "-#{options.limit}"

  # args.push 'HEAD'

  git = child_process.spawn "git", args,
    cwd: root


  committers = {}
  committerEmails = {}
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

      # author
      when 2
        commit.author = data
        committers[data] ||= 0
        committers[data] +=  1
      when 3
        commit.authorEmail = data

      # comitter
      when 4
        commit.comitter = data
      when 5
        committerEmails[data] ||= 0
        committerEmails[data] +=  1

        commit.comitterEmail = data

      when 6
        commit.subject = data
      when 7
        commit.parents = data.split(/\s+/)
      when 8
        parts = data.split("\n")

        commit.tv = parseInt(parts.shift())
        commit.summary = parseCommitSummary(parts.shift())

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
    callback?({
      commits: commitList
      committers: committers
      committerEmails: committerEmails
      commitShaIndex: commitReverseIndex
     }, code == 0 )





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
  module.exports.getHistory "#{process.env['HOME']}/dev/plus2/davidson", {limit: 100}, (err, data) ->
    console.log "err", err
    console.log "data", data

