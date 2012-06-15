
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
  filePath : path.join(__dirname, 'test.log')
  , fileFlag : 'w'
  , fileEncoding : 'utf8'
  , bufferingSrc : true
  , alwaysLog : 'MASTER CLUSTER'
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
request.get(header).pipe(logger)


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


console.error(new Error('testin---Error----SB'))
console.warn('WARNING: I AM TESTIN WARNING')
