'use strict'

let Logger = require('sb/etc/Logger.js')('MongoHelper')
let Mongo = require('mongodb')
let Helper = require('sb/etc/Helper.js')

let instance = null

/**
 * All this function does is initialize a mongo database
 * that can then be used.  This singleton stores all connections
 * made
 *
 */
class MongoHelper {
  constructor() {
    if (!instance) {
      this.connMap = new Map()
      instance = this
    }
    return instance
  }

  /**
   * Initializes a new connection to a database.  If a connection already exists
   * it returns that old connection.
   *
   * Following advice from here http://stackoverflow.com/questions/10656574/how-to-manage-mongodb-connections-in-a-nodejs-webapp
   * Basically says to reuse connections.  A pool of 5 connections is created by default.
   */
  initialize(databaseName, url) {
    //this.mongoClient = new MongoClient(new Server("localhost", 27017), {native_parser: true});

    Helper.logAndThrowUndefined('MongoHelper: You forgot the database url', url)
    Helper.logAndThrowUndefined(
      'MongoHelper: You forgot the datbase name',
      databaseName
    )

    let fullUrl = url + '/' + databaseName
    let connectionExists = this.connMap.get(fullUrl)
    if (connectionExists) {
      return Promise.resolve(connectionExists)
    }

    Logger.debug('Initializing mongodb connection', fullUrl)

    let tPromise = new Promise((resolve, reject) => {
      Mongo.connect(fullUrl, (err, db) => {
        if (err || !db) {
          Logger.error('Mongodb connection error', err)
          reject()
        } else {
          db.open(nerr => {
            if (nerr) {
              Logger.err(
                'Error opening database',
                databaseName,
                'with error',
                nerr
              )
              reject(nerr)
            } else {
              Logger.info('Mongodb finished connecting')
              this.connMap.set(fullUrl, db)
              resolve(db)
            }
          })

          //Setting this to null on close should tell mongo that it needs to re-initialize
          //the database on the next call
          db.on('close', function() {
            db = null
          })
        }
      })
    })

    return tPromise
  }

  /**
   * Close all open connections in the map
   */
  close() {
    Logger.info('Closing mongodb connection in MongoHelper')
    for (let i of this.connMap.values()) {
      if (i) {
        i.close()
      }
    }
  }
}

module.exports = MongoHelper
