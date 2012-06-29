
//testing below
var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , util = require('util')
  , i = 0
  , log = require('./log.js')
  , logOpts
  , logger
  , request = require('request')
  
logOpts = {
  filePath : path.join(__dirname, 'logfile.log')
  , fileFlag : 'a'
  , fileEncoding : 'utf8'
  , bufferingSrc : true
  , alwaysLog : 'MASTER CLUSTER'
  //, toStdout : false //defaults to true
}
logger = log.createConsole(console, logOpts)

console.pipe(fs.createWriteStream(path.join(__dirname, 'new.log')))
//fs.createReadStream(path.join(__dirname, 'longFile.txt'), {encoding:'utf8'}).pipe(logger)
console.log('testin number: %d', 4, ' hello')
console.log('testing object: ', {hello : 'world'})
process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.pipe(logger)
var header = {
  url : 'http://saambarati.org'
  , headers : {
    accept : 'text/html'
  }
}
var reqs = request.get(header)
reqs.pipe(logger)
reqs.on('end', function () {
  process.nextTick(function() {
    console.warn('about to exit process... test has completed')
    //process.nextTick(function() {process.exit(0)})
    setTimeout(function(){process.exit(0)}, 2000)
  })
})


//TODO, why is it emitting data twice?
var app = http.createServer(function (req, res) {
  res.writeHead(200, {'content-type' : 'text/plain'})
  res.write('hello')
  console.log(req.headers)
  //console.log('piping to res')
  logger.pipe(res)
})
app.listen(8081)

function checkMem () {
  setTimeout(checkMem, 1000)
  console.log(util.inspect(process.memoryUsage()))
}
//checkMem()


console.error(new Error('ERROR_MESSSAGE'))
console.warn('WARNING: I AM TESTIN WARNING')
console.trace('TRACING')

for (var i = 0; i < 50; i++) {
  console.log('testing piping to files: ' + i)
}

