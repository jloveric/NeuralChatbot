'use strict'

let Logger = require('sb/etc/Logger.js')('UserModel')
let mongoose = require('mongoose')
let passportLocalMongoose = require('passport-local-mongoose')
let Schema = mongoose.Schema

let Account = new Schema({
  username: String,
  password: String,
})

Account.plugin(passportLocalMongoose)

module.exports = mongoose.model('Account', Account)
