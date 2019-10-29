#!/usr/bin/env node

'use strict'

let debug = require('debug')('RegisterUser')
let Helper = require('sb/etc/Helper.js')
let DeleteUserAccount = require('sb/extdb/DeleteUserAccount.js')

let args = require('minimist')(process.argv.slice(2))

let GetConfigValues = require('sb/etc/GetConfigValues.js')
let gc = new GetConfigValues()

if (!args.username) {
  console.log('Must specify --username')
  process.exit(0)
}

let du = new DeleteUserAccount()

//All names need to be lower case otherwise it causes problems with elasticsearch.
args.username = args.username.toLowerCase()

let obj = {
  fileDatabase: gc.mongodb.fileDatabase,
  messageDb: gc.mongodb.messageDatabase,
  usernameDb: gc.mongodb.userAccounts,
  user: args.username,
  mongoUrl: gc.mongodb.url,
  botDatabase: gc.mongodb.botDatabase,
}

du.deleteAccount(obj)
  .then(() => {
    console.log('Deleted user account', args.username)
    process.exit(0)
  })
  .catch(reason => {
    console.log('Failed to delete user account', reason)
    process.exit(0)
  })
