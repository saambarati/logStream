
//stolen from Resig
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var util = require('util')
  , stream = require('stream')
  , fs = require('fs')
  , SECRET_SAUCE = '17dj_)91' //this is experimental, but just have some way to privatize stream writes so we can buffer multiple src streams
  , colorful = require('./colorful.js')
  

/* create a streaming Logger
 *  API = private
 *  @param options {Object}
 *           properties => bufferingSrc = buffer pipes till 'end' event
 *                         maxBufferSize in Bytes. Defaults to 10 MB, which is pretty huge for a console dumb
 *                         alwaysLog => something to always log
*/
function Log(options) {
  stream.Stream.call(this)
  var self = this
  self.writable = true //piping to me
  self.readable = true //piping to a dest
  //trying something unconventional by having multiple destinations and sources
  self.srcs = []
  self.dests = []
  if (options) {
    if (typeof options.bufferingSrc !== 'undefined') self.bufferingSrc = options.bufferingSrc
    if (typeof options.maxBufferSize !== 'undefined') self.maxBufferSize = options.maxBufferSize
    self.alwaysLog = options.alwaysLog || ''
  } else {
    self.bufferingSrc = true //regarding being readable stream, don't emit data until buffering stops
    self.maxBufferSize = 10 * 1024 * 1024
    self.alwaysLog = ''
  }

  self.on('pipe',  Log.prototype.onPipe)
}
util.inherits(Log, stream.Stream)

//writable stream stuff. This is really a hack around default write calls
Log.prototype.onPipe = function (src) {
  var self  = this
    , buf = []
    , bufSize = 0
    , ended = false
    , index = self.srcs.length
    , clearing = false
    , numBytes = 0

  function clearBuf () {
    if (clearing) return  //don't emit the same data more than once
    clearing = true
    process.nextTick(function () {
      //console.log('clearing buffer')
      clearing = false
      self.write(buf.join(''), null, SECRET_SAUCE)
      buf = []
      numBytes = 0
    })
  }
  function ondata(c) {
    var pusher
      , tmpBuf
    if (Buffer.isBuffer(c)) {
      numBytes += c.length
      pusher = c.toString('utf8')
    } else {
      pusher = '' + c //incase it isn't a string
      tmpBuf = new Buffer(pusher)  //this could result in excessive allocations if we continually allocate stuff just to get Byte count, something to watch for...
      numBytes += tmpBuf.length
      tmpBuf = null
    }
    //console.log('current buffering bytes: %d', numBytes)
    buf.push(pusher)
    if (!self.bufferingSrc || numBytes > self.maxBufferSize) clearBuf()
  }
  src.on('data', ondata)

  function onEndAndClose() {
    //console.log('src on "end" or "close" listener')
    if (ended) { console.warn('ALREADY ENDED/CLOSED, NOT PROCESSING SECOND END/CLOSE CALL'); return;}
    clearBuf()
    ended = true
    cleanup()
  }
  src.on('end', onEndAndClose)
  src.on('close', onEndAndClose)

  function onerror(e) {
    //console.log('error in src stream:' + e.message + e.stack)
    //self.emit('error', e)
    if (e) self.error(e)
    cleanup()
  }
  src.on('error', onerror)

  function cleanup() {
    //console.log('removing src listeners')
    src.removeListener('end', onEndAndClose)
    src.removeListener('close', onEndAndClose)
    src.removeListener('data', ondata)
    src.removeListener('error', onerror)
    self.srcs.remove(self.srcs.indexOf(src))
    //console.log('number of sources: %d', self.srcs.length)
  }
  //add src to sources
  self.srcs.push(src)
}

//readable stream method, essentially, pipe the data we are receiving from srcs to a destination
Log.prototype.pipe = function (destination, opts) {
  var self = this
    , onClose = false

  if (!opts) opts = {}
  opts.end = false //we never emit 'end' event
  self.dests.push(destination) 

  function onCloseOrError (err) {
    if (onClose) return
    onClose = true
    self.dests.remove(self.dests.indexOf(destination)) 
    if (err) self.error(err)
    //console.log('onCloseOnError listener')
    destination.removeListener('error', onCloseOrError)
    destination.removeListener('close', onCloseOrError)
  }
  destination.on('close', onCloseOrError)
  destination.on('error', onCloseOrError)

  //console.log('adding destination')
  stream.Stream.prototype.pipe.call(this, destination, opts)
  //console.log('number of selfs listeners for data: %d', self.listeners('data').length)
  return destination
}

//writable methods. Ignore data events unless they are part of our buffered events
//this is definitely ugly, and not like the normal, elegant, stream interface
Log.prototype.end = function (chunk, key) {
  if (chunk) {
    //console.log(chunk)
    console.log('ended with chunk')
    this.write(chunk, key)
  } else {
    console.log('ended without chunk')
  }
}
Log.prototype.write = function (chunk, encoding, key) {
  if (key !== SECRET_SAUCE && encoding !== SECRET_SAUCE) return //stop from normal piping b/c we are caching solo
  if (encoding && encoding !== SECRET_SAUCE)  chunk = chunk.toString(encoding)
  //console.log('write method on Log called')
  //this.emit('data', chunk)
  this.log(chunk) //will emit 'data'
}

var slice = Array.prototype.slice
//logging shit
Log.prototype.formatArgs = function () {
  var i
    , args = slice.call(arguments)
  for (i = 0; i < args.length; i++) {
    if (args[i].toString() === '[object Object]') {
      //API=>util.inspect(object, [showHidden], [depth], [colors])
      args[i] = util.inspect(args[i], false, 1, true)
    } else if (Buffer.isBuffer(args[i])) {
      //console.log('is buffer')
      args[i] = args[i].toString('utf8')
    } else if (util.isError(args[i])) {
      args[i] = '' + args[i] + args[i].message + args[i].stack
    }
  }
  return args
}
Log.prototype.log = function () {
  var args = this.formatArgs.apply(this, slice.apply(arguments))
    , data 

  data = colorful.colorMany([
        ['green', (new Date()).toString()]
        , ['white', '::=>']
        , ['blue', this.alwaysLog]
      ])
  
  data += ' ' + util.format.apply(util, args)
  data = data.replace(/(\r\n|\n|\r)/gm, '', 'gm') + '\n'
  this.emit('data', data)
}
Log.prototype.info = Log.prototype.log
Log.prototype.error = function () {
  var args = this.formatArgs.apply(this, slice.apply(arguments))
    , data
  
  data = colorful.colorMany([
        ['red', (new Date()).toString()]
        , ['white', '::=>']
        , ['blue', this.alwayslog]
      ])
  data +=  ' ' + util.format.apply(util, args)
  //data = data.replace(/(\r\n|\n|\r)/gm, '', 'gm') + '\n'
  data += '\n' //try not stripping lines on error
  this.emit('data', data)
}
Log.prototype.warn = function () {
  var args = this.formatArgs.apply(this, slice.apply(arguments))
    , data
  
  data = colorful.colorMany([
        ['yellow', (new Date()).toString()]
        , ['white', '::=>']
        , ['blue', this.alwayslog]
      ])
  data +=  ' ' + util.format.apply(util, args)
  data = data.replace(/(\r\n|\n|\r)/gm, '', 'gm') + '\n'
  this.emit('data', data)
}



/*
 * @API Public
 * @param console {global object}
 * @param options {object} 
 *                => filePath --> to log to a file as well
 *                => fileFlag open flag => defaults to 'a' --> append
 *                => fileEncoding => defaults to utf8
 *                => bufferingSrc -> whether to buffer incoming pipes -> defaults to true
 *                => alwaysLog -> something that will at the beginning of each log statement
*/
//creates a logger that can also replace the console
function createConsole (cons, opts) {
  if (!opts) opts = {}
  var log = new Log({ bufferingSrc : (opts.bufferingSrc !== undefined ? opts.bufferingSrc : true), alwaysLog : opts.alwaysLog })
    , fileOpts

  log.pipe(process.stdout)
  if (opts.filePath) {
    fileOpts = {
      flags : opts.fileFlag || 'a'
      , encoding : opts.fileEncoding || 'utf8'
    }
    log.pipe(fs.createWriteStream(opts.filePath, fileOpts))
  }
  
  cons.pipe = log.pipe.bind(log)
  cons.log = log.log.bind(log)
  cons.info = log.info.bind(log)
  cons.warn = log.warn.bind(log)
  cons.error = log.error.bind(log)

  return log
}

exports.createConsole = createConsole



