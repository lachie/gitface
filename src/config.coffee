fs                = require "fs"
path              = require "path"

module.exports = class Config
  @userConfigurationPath: path.join process.env['HOME'], ".gitfacerc"

  @evalConfig: (path, callback) ->
    fs.readFile path, 'utf8', (err, data) ->
      throw err if err
      config = new Function( "return #{data}" )()
      callback null, config


  @loadUserConfig: (callback) ->
    path.exists p = @userConfigurationPath, (exists) ->
      if exists
        Config.evalConfig p, callback
      else
        callback null, {}


  @getUserConfig: (callback) ->
    @loadUserConfig (err, data) ->
      if err
        callback err
      else
        callback null, new Config(data)


  constructor: (options={}) ->
    @port = options.port || 3000

  baseUrl: ->
    "http://localhost:#{@port}/"

  repoUrl: (root)->
    @baseUrl()+"r?root=#{root}"

unless module.parent?
  Config.getUserConfig (err, cfg) ->
    throw err if err
    console.log "loadedConfig:", cfg.port
