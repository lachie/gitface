{EventEmitter} = require('events')

exports.LogBuffer = class LogBuffer extends EventEmitter
  constructor: ->
    @field = 0
    @recordIndex = 0

  add: (data) ->
    start = 0

    for i in [0...data.length]
      finished = false
      char = data[i]

      if char < 2
        @emitField data.slice(start, i)
        start = i + 1
        finished = true

        if char == 0
          @emit 'record', @recordIndex
          @recordIndex += 1
          @field = 0

    unless finished
      @lastBuffer = data.slice(start, data.length)

  emitField: (data) ->
    string = data.toString()
    if @lastBuffer
      string = @lastBuffer.toString() + string
      @lastBuffer = null

    @emit 'field', string, @field
    @field += 1

  finish: ->
    if @lastBuffer
      @emit 'field', @lastBuffer.toString(), @field
      @emit 'record', @recordIndex


