'use strict'

let Logger = require('sb/etc/Logger.js')('UserAccount')
let mongoose = require('mongoose')
let userModel = require('./UserModel.js')
let GetConfigValues = require('sb/etc/GetConfigValues.js')

class UserAccount {
  constructor() {
    this.Model = userModel
    this.gf = new GetConfigValues()
  }

  close() {
    mongoose.disconnect()
  }

  initialize() {
    //Saw these options at stackoverflow
    //http://stackoverflow.com/questions/30909492/mongoerror-topology-was-destroyed
    //didn't seem to make a difference for my problem though, but trying it.
    let options = {
      server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
      replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    }

    let np = new Promise((resolve, reject) => {
      mongoose.connect(this.gf.mongodb.url + '/useraccounts', options, () => {
        resolve()
      })
    })

    return np
  }

  findUser(obj) {
    let np = new Promise((resolve, reject) => {
      this.Model.findOne(obj, (err, nAccount) => {
        if (err) {
          Logger.error('Find user error', err)
          reject(err)
        } else {
          Logger.info('Found user:', nAccount.username)
          resolve(nAccount)
        }
      })
    })

    return np
  }

  addUser(obj) {
    let account = new this.Model(obj)
    let np = new Promise((resolve, reject) => {
      Logger.info('Attempting to add new users')
      account.save(function(error) {
        if (error) {
          Logger.error('Account add user error', error)
          reject()
        } else {
          Logger.info('Added new user')
          resolve(true)
        }
      })
    })

    return np
  }

  deleteUser(obj) {
    Logger.error('delete user not implemented')
  }
}

module.exports = UserAccount
