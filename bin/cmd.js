#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var brfs = require('../')

var file = process.argv[2]

if (file === '-h' || file === '--help') {
  fs.createReadStream(path.join(__dirname, 'usage.txt'))
    .pipe(process.stdout)
} else {
  var fromFile = file && file !== '-'
  var rs = fromFile
      ? fs.createReadStream(file)
      : process.stdin

  var fpath = fromFile ? file : path.join(process.cwd(), '-')
  rs.pipe(brfs(fpath)).pipe(process.stdout)
}
