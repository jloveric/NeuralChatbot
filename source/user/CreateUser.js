'use strict'

let Logger = require('sb/etc/Logger.js')('CreateUser')
let passport = require('passport')
let GoogleStrategy = require('passport-google').Strategy
let LocalStrategy = require('passport-local').Strategy
let UserAccount = require('sb/user/UserAccount.js')

/**
 * The goal of this is to be able to register a user using
 * passport which should provide the relevant hashing and be
 * independent of running a server, so I can use it to install
 * from the command line.  Not totally sure I've done things
 * correctly.
 */
class CreateUser {
  constructor() {
    this.UserAccount = new UserAccount()
  }

  close() {
    this.UserAccount.close()
  }

  initialize() {
    this.UserAccount.initialize()
    let Account = this.UserAccount.Model

    passport.use(
      'local',
      new LocalStrategy(
        Account.authenticate({
          usernameField: 'username',
          passwordField: 'password',
        })
      )
    )

    passport.serializeUser(Account.serializeUser())
    passport.deserializeUser(Account.deserializeUser())

    this.passport = passport
  }

  registerUser(username, password) {
    Logger.info('Trying to register user', username)

    let np = new Promise((resolve, reject) => {
      this.UserAccount.Model.register(
        new this.UserAccount.Model({ username: username }),
        password,
        (err, account) => {
          //TODO, I would like these to use resolve, reject like normal
          //however, doing so is breaking test right now.
          if (err) {
            debug('Registration failed for user', username, err)
            Logger.error('Registration failed for user', username, err)
            resolve(false)
          } else {
            Logger.warn('Registered user', username)
            resolve(true)
          }
        }
      )
    })

    return np
  }
}

module.exports = CreateUser
