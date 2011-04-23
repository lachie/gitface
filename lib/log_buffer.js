(function() {
  var EventEmitter, LogBuffer;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  exports.LogBuffer = LogBuffer = (function() {
    __extends(LogBuffer, EventEmitter);
    function LogBuffer(options) {
      if (options == null) {
        options = {};
      }
      this.fieldSep = options.fieldSep || 1;
      this.recordSep = options.recordSep || 0;
      this.field = 0;
      this.recordIndex = 0;
    }
    LogBuffer.prototype.add = function(data) {
      var char, finished, i, start, _ref;
      start = 0;
      for (i = 0, _ref = data.length; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        finished = false;
        char = data[i];
        if (char === this.fieldSep || char === this.recordSep) {
          this.emitField(data.slice(start, i));
          start = i + 1;
          finished = true;
          if (char === this.recordSep) {
            this.emit('record', this.recordIndex);
            this.recordIndex += 1;
            this.field = 0;
          }
        }
      }
      if (!finished) {
        return this.lastBuffer = data.slice(start, data.length);
      }
    };
    LogBuffer.prototype.emitField = function(data) {
      var string;
      string = data.toString();
      if (this.lastBuffer) {
        string = this.lastBuffer.toString() + string;
        this.lastBuffer = null;
      }
      this.emit('field', string, this.field);
      return this.field += 1;
    };
    LogBuffer.prototype.finish = function() {
      if (this.lastBuffer) {
        this.emit('field', this.lastBuffer.toString(), this.field);
        return this.emit('record', this.recordIndex);
      }
    };
    return LogBuffer;
  })();
}).call(this);
