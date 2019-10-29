'use strict'

let Logger = require('sb/etc/Logger.js')('DeleteUserAccount')
let MongoFilesystem = require('./MongoFilesystem.js')
let MongoHelper = require('sb/extdb/MongoHelper.js')
let Helper = require('sb/etc/Helper.js')

/**
 * Delete user account information.  If an error occurs the return values is
 * still resolved() since the error may occur if a table does not exist or database
 * does not exist.
 */
class DeleteUserAccount {
  constructor(configObject) {}

  deleteAccount(conf) {
    Logger.info('Attempting to delete account', conf)
    if (
      !Helper.hasProperties(conf, [
        'fileDatabase',
        'messageDb',
        'usernameDb',
        'user',
        'mongoUrl',
        'botDatabase',
      ])
    ) {
      Helper.logAndThrow('Properties must be defined')
    }

    let fileDatabase = conf.fileDatabase
    let messagedb = conf.messageDb
    let usernamedb = conf.usernameDb
    let user = conf.user
    let url = conf.mongoUrl
    let botDb = conf.botDatabase

    let mongod = new MongoFilesystem()
    let p1 = mongod.initialize(fileDatabase)

    //delete the user from the filesystem
    let np1 = new Promise((resolve, reject) => {
      p1.then(() => {
        mongod
          .deleteUserAccount(user)
          .then(() => {
            Logger.info('Deleted filesystem entries for', user)
            resolve()
          })
          .catch(reject => {
            Logger.error('Failed to delete user account')
            resolve()
          })
      })
    })

    let mongoHelper = new MongoHelper()
    let p2 = mongoHelper.initialize(messagedb, url)

    //delete the users qa database
    let np2 = new Promise((resolve, reject) => {
      p2.then(db => {
        db.collection(user).drop((err, response) => {
          if (err) {
            //Like the db doesn't exist
            Logger.warn(
              'Error dropping messaging database for user',
              user,
              'since database does not exist'
            )
            resolve()
          } else {
            Logger.info('Removed data from', messagedb, 'for user', user)
            resolve()
          }
        })
      }).catch(reason => {
        Logger.error('MongoHelper initialize failed', reason)
      })
    })

    let p3 = mongoHelper.initialize(usernamedb, url)

    //delete the information from the usernamedb
    let np3 = new Promise((resolve, reject) => {
      p3.then(db => {
        db.collection('accounts').deleteMany({ username: user }, (err, res) => {
          if (err) {
            Logger.error(err)
            resolve()
          } else {
            Logger.info('Removed user login information for', user)
            resolve()
          }
        })
      }).catch(reason => {
        Logger.error(reason)
      })
    })

    let p4 = mongoHelper.initialize(botDb, url)
    let np4 = new Promise((resolve, reject) => {
      p4.then(db => {
        db.collection('bots').deleteMany({ user: user }, (err, res) => {
          if (err) {
            Logger.error(err)
            resolve()
          } else {
            Logger.info('Removed botInformation for', user)
            resolve()
          }
        })
      })
    })

    //Wait until all work has completed to return true
    let final = new Promise((resolve, reject) => {
      Promise.all([np1, np2, np3, np4])
        .then(() => {
          Logger.info('Successfully removed account')
          mongod.close()
          resolve()
        })
        .catch(reason => {
          mongod.close()
          Logger.error(reason)
          reject()
        })
    })

    return final
  }
}

module.exports = DeleteUserAccount
