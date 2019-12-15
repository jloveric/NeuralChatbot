'use strict'

let MongoFilesystem = require('../extdb/MongoFilesystem.js')
let MongoHelper = require('../extdb/MongoHelper.js')
let Logger = require('helper-clockmaker').Logger('FileConsistency')

/**
 * Check to make sure all the files that are needed
 * exist.  The bot should exist in the database and the
 * database that refers to should exist in the filesystem.
 * Basically we need, 'logstash', 'databaseConfig','database'
 * and the bot need to have info.database = filename, and
 * filename must exist (along with the 3 extensions) inside
 * the filesystem.
 */
class FileConsistency {
  constructor() {
    this.mongoFilesystem = new MongoFilesystem()
    this.botDatabase = new MongoHelper()
  }

  /**
   * Actually checks whether you have all the right files to initialize
   * a bot that requires files -- including generating an es database.
   * @param config must have the following fields
   * --botDatabase which is the mongo database containing bot information
   * --url which is the base url for mongo
   * --fileDatabase which is the mongo database where the files are stored
   * --user which is the name of the user who registerd the bot.
   */
  checkConsistency(config) {
    let p1 = this.botDatabase.initialize(config.botDatabase, config.url)
    let p2 = this.mongoFilesystem.initialize(config.fileDatabase)

    //Make sure the bot exists in the filesystem.
    let pBot = p1.then(db => {
      this.db = db
      console.log('config.user', config.user)
      return new Promise((resolve, reject) => {
        this.db
          .collection('bots')
          .findOne({ user: config.user }, (err, item) => {
            if (err) {
              reject(err)
            } else if (item) {
              console.log('found', item)
              Logger.debug('found bot in botDatabase', item)
              resolve(item.info)
            } else if (!item) {
              console.log("didn't find", item)
              Logger.warn('Bot', config.user, 'Not found in database.')
              reject()
            }
          })
      })
    })

    //Make sure all 3 required files exist.
    let pMongo = Promise.all([p2, pBot])
      .then(ans => {
        let filename = ans[1].database
        let botType = ans[1].botType

        Logger.debug('FileConsistency filename', filename, 'botType', botType)
        let pList = []

        //The Mongo type takes directly from the mongo database so it doesn't store
        //extra data in the filesystem in csv format.
        if (botType != 'mongo') {
          pList.push(
            this.mongoFilesystem.doesFileExist(
              filename,
              config.user,
              'database'
            )
          )
          pList.push(
            this.mongoFilesystem.doesFileExist(
              filename,
              config.user,
              'logstash'
            )
          )
          pList.push(
            this.mongoFilesystem.doesFileExist(
              filename,
              config.user,
              'databaseConfig'
            )
          )

          Promise.all(pList)
            .then(ans => {
              if (
                ans.every(elem => {
                  return elem
                })
              ) {
                return Promise.resolve(filename)
              } else {
                return Promise.reject()
              }
            })
            .catch(reason => {
              return Promise.reject(reason)
            })
        } else {
          return Promise.resolve()
        }
      })
      .catch(reason => {
        return Promise.reject(reason)
      })

    return pMongo
      .then(filename => {
        return Promise.resolve(filename)
      })
      .catch(reason => {
        return Promise.reject(reason)
      })
  }
}

module.exports = FileConsistency
