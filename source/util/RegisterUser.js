#!/usr/bin/env node

"use strict"

let debug = require('debug')('RegisterUser')
let Helper = require('sb/etc/Helper.js')
let InstallBot = require('sb/extdb/InstallBot.js')


let args = require('minimist')(process.argv.slice(2));


if (!args.username) {
  console.error('Must specify --username')
  process.exit(0)
}
if (!args.password) {
  console.error('Must specify --password')
  process.exit(0)
}

let ib = new InstallBot()

//All names need to be lower case otherwise it causes problems with elasticsearch.
args.username = args.username.toLowerCase();

ib.registerEmptyUser(args.username, args.password).then((ans) => {

  if (ans) {
    console.log('Registered user', args.username)
  } else {
    console.error('Failed to register user since user already exists', args.username)
  }
  process.exit(0)
}).catch((reason) => {
  console.error('Failed to register', reason)
  process.exit(0)
})


