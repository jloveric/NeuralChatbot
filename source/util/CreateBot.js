#!/usr/bin/env node

'use strict'

let debug = require('debug')('CreateBot')
let { Helper } = require('helper-clockmaker')
let InstallBot = require('../extdb/InstallBot.js')

let args = require('minimist')(process.argv.slice(2))

if (!args.username) {
  console.error('Must specify --username')
  process.exit(0)
}
if (!args.password) {
  console.error('Must specify --password')
  process.exit(0)
}

if (!args.install) {
  console.error('Must specify installation file')
  process.exit(0)
}

let ib = new InstallBot()

//All names need to be lower case otherwise it causes problems with elasticsearch.
args.username = args.username.toLowerCase()

ib.install(args.username, args.password, args.install)
  .then(() => {
    ib.close()
    console.log('success')
    process.exit(0)
  })
  .catch(reason => {
    console.error('error', reason)
    process.exit(0)
  })
