
logStream
========

logStream is a still a huge work in progress, but the gist is enabling you to stream stuff into your log file, and also stream your log elsewhere.
There are still quite a few things that need some attention, such as the ANSI colors being streamed into a file ruins the readability of the file.

Usage
----
```
var logStream = require('logStream') 
  , http = require('http')
  , path = require('path')
  , request = require('request')
  , logOpts
  , log

//there are more options, but they aren't all working properly yet...
logOpts = {
  alwaysLog : 'ALWAYS'
}

log = logStream.createConsole(console, logOpts) //automatically binds to console.info, console.error, console.warn, console.log
console.log('this prints a number: %d', 10)
console.log('this prints an object', {hello : 'world'})
console.info('currently info is same as log')
console.warn('WARNING')
console.error(new Error('i am an error'))

//pipe to a file, also, you can pass filePath option and createConsole will automatically do this for you
log.pipe(fs.createWriteStream(path.join(__dirname, 'neats.log'))) 

//pipe log to http request
http.createServer(function(req, res) {
  log.pipe(res)  //log never emits end, btw
})
http.listen(1337)

//pipe a url request, currently, the response is buffered, and only written to the console on the 'end' of data or when it passes 10MB in size
request('http://urlToSomeJson').pipe(log)

```
