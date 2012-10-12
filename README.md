
logStream
========

logStream is a still a huge work in progress, but the gist is enabling you to stream stuff into your log file, and also stream your log elsewhere.
There are still quite a few things that need some attention, such as the ANSI colors being streamed into a file ruins the readability of the file.

Usage
----

`logStream` is an instance of [`stream-master`](https://github.com/saambarati/node-stream-master) so all methods on that
object apply to logStream.

```
var logStream = require('logStream')
  , http = require('http')
  , path = require('path')
  , request = require('request')
  , logOpts
  , log

/**
*  options object
*  {string} filePath       to log to a file as well, basically pipes logger to a fs.writeStream
*  if (filePath)
*    {string} fileFlag       how to open the file in filePath. defaults to 'a' --> append
*    {string} fileEncoding   defaults to utf8
*  {string} alwaysLog      something that will be written at the beginning of each log statement. useful for identifying separate clusters
*  {bool}   toStdout       whether to write data to stdout. Defaults to true
*  {object} console        object to attach 'log', 'error', 'info' methods. default is the global console object
*  {number} bufSize        the buffer size of logger.child() streams before they emit data
*/
logOpts = {
  filePath : f1Path
  , fileFlag : 'w'
  , fileEncoding : 'utf8'
  , alwaysLog : 'This string will always be logged, useful for identifying separate clusters, etc'
  //, toStdout : false //defaults to true
}

//automatically binds to console.info, console.error, console.warn, console.log
// if you want logStream to overwrite another console object, pass it is the 'console' option
log = logStream(logOpts)
console.log('this prints a number: %d', 10)
console.log('this prints an object', {hello : 'world'})
console.info('currently info is same as log')
console.warn('this is a WARNING')
console.error(new Error('i am an error'))

//pipe to a file, also, you can pass filePath option and createConsole will automatically do this for you
log.pipe(fs.createWriteStream(path.join(__dirname, 'piped.log')))

//pipe log to http request
var app = http.createServer(function(req, res) {
  log.pipe(res)  //log never emits end, btw
})
app.listen(1337)

//pipe a url request, currently, the response is buffered,
//and only written to the console on the 'end' of data or when it passes 10MB in size
request('http://urlToSomeJson').pipe( log.child() )
log.child( request('http://nodejs.org') ) //logStream will listen for data events on request(url) object


```
