var util = require('util')
  , fs = require('fs')
  , dateable = require('dateable')
  , master = require('stream-master')
  , slice = Array.prototype.slice

require('colors') //enable color getters for strings

/*
 * @API Public
 * @param options {object}
 *                => {string} filePath       to log to a file as well
 *                => {string} fileFlag       how to open the file in filePath. defaults to 'a' --> append
 *                => {string} fileEncoding   defaults to utf8
 *                => {string} alwaysLog      something that will be written at the beginning of each log statement
 *                => {bool}   toStdout       whether to write data to stdout. Defaults to true
 *                => {object} console        where i should attach 'log', 'error', etc methods to. default is the global console object
 *                => {number} bufSize        the buffer size of logger.child() streams before they emit data
*/
function create(opts) {
  if (!opts) opts = {}
  opts.toStdout = (opts.toStdout === undefined ? true : opts.toStdout)
  opts.console = opts.console || console
  opts.dateFormat = opts.dateFormat || 'MM/DD/YYYY##HH:mm:ss'
  opts.bufSize = opts.bufSize || 20 * 1024

  var logger = master({bufSize : opts.bufSize})
    , fileOpts
    , cons = opts.console
    , dateFormat = opts.dateFormat
    , stdoutColors
    , toStdout //function to write to process.stdout
    , streamer = logger.child(0)  //keep logger's child to have a never ending writable stream. 0 indicates unbuffered stream

  if (opts.filePath) {
    fileOpts = {
      flags : opts.fileFlag || 'a'
      , encoding : opts.fileEncoding || 'utf8'
    }
    logger.pipe(fs.createWriteStream(opts.filePath, fileOpts))
  }

  /**
   * @param {array} arguments
   * @return {array} of args
  */
  function formatArgs (/*array of arguments*/) {
    var i
      , args = slice.call(arguments)
      , arg
    for (i = 0; i < args.length; i++) {
      arg = args[i]
      if (arg && arg.toString() === '[object Object]' ) {
        //util API=>util.inspect(object, [showHidden], [depth], [colors])
        args[i] = util.inspect(args[i], false, 1, false)
      } else if (Buffer.isBuffer(arg)) {
        args[i] = args[i].toString('utf8')
      } else if (util.isError(arg)) {
        args[i] = '' + args[i].stack
      }
    }
    return util.format.apply(util, args)
  }

  function formattedDate() {
    return dateable.format(new Date(), dateFormat)
  }

  stdoutColors = {
    'log' : 'green'
    , 'error' : 'red'
    , 'warn' : 'yellow'
  }

  toStdout = (opts.toStdout ?
    function (type, args, date) { //write to stdout (default)
      //this event is fired on 'tostdout'
      var color = stdoutColors[type]
        , data = date[color] + '=>'.white + opts.alwaysLog.blue + ' ' + args

      if (type === 'error')  data += '\n' //don't strip lines
      else data = data.replace(/(\r\n|\n|\r)/gm, '') + '\n'

      process.stdout.write(data)
    }
    :
    function () {} //don't write to stdout
  )

  function logTheData() {
    var args = formatArgs.apply(formatArgs, slice.apply(arguments))
      , data
      , date = formattedDate()
      , type = this //i.e 'error', 'log', 'warn'

    toStdout(type, args, date)
    data = date + '=>' + opts.alwaysLog + ' ' + args
    if (type === 'error') {
      data += '\n' //don't strip lines
    } else {
      data = data.replace(/(\r\n|\n|\r)/gm, '') + '\n'
    }

    data = new Buffer(data)
    data.__logStreamDontWrite = true //make sure when logger emits data it doesn't re-write what we write. Kindof hacky, but a simple solution
    streamer.write(data)
  }


  //bind to the type so we know what type of operation we are running
  cons.log   = logger.log   = logTheData.bind('log')
  cons.info  = logger.info  = logTheData.bind('log')
  cons.warn  = logger.warn  = logTheData.bind('warn')
  cons.error = logger.error = logTheData.bind('error')

  logger.on('data', function onData(data) {
    if (data.__logStreamDontWrite) return
    var args = formatArgs(data)
    toStdout('log', args, formattedDate())
  })

  return logger
}

module.exports = create
module.exports.create = create //backwards compatability


