
//testing below
var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , util = require('util')
  , assert = require('assert')
  , request = require('request')
  , log = require('./log.js')
  , logOpts
  , logger
  , i = 0
  , f1Path = path.join(__dirname, 'logfile.log')
  , f2Path = path.join(__dirname, 'pipe.log')

logOpts = {
  filePath : f1Path
  , fileFlag : 'w'
  , fileEncoding : 'utf8'
  , bufferingSrc : true
  , alwaysLog : 'MASTER CLUSTER'
  //, toStdout : false //defaults to true
}
logger = log(logOpts)

//pipe to a file
logger.pipe(fs.createWriteStream(f2Path, {flags : logOpts.fileFlag }))

//fs.createReadStream(path.join(__dirname, 'longFile.txt'), {encoding:'utf8'}).pipe(logger)
console.log('testing %% operators: number: %d', 1, ' hello')
console.log('testing object: ', {hello : 'world', nested : { another:'object'}})
console.warn('testing warning')
console.trace('console.trace')
console.error(new Error('testing error'))

var header = {
  url : 'http://saambarati.org'
  , headers : {
    accept : 'text/html'
  }
}

var reqs = request('http://saambarati.org')
reqs.pipe(logger.child())

reqs.on('end', function () {
  logger.log('reqs ended')
  process.nextTick(function() {
    //process.nextTick(function() {process.exit(0)})
    setTimeout(function(){process.exit(0)}, 0)
  })
})



process.on('exit', function() {
  assert(fs.readFileSync(f1Path, 'utf8') === fs.readFileSync(f2Path, 'utf8'))
  console.log('piped files are equal')
  console.log('processes exiting, tests have passed')
})



