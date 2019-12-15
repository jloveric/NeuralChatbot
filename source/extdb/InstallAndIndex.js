'use strict'

let CreateDatabaseConfig = require('../extdb/CreateDatabaseConfig.js')
let CreateLogstashConfig = require('../extdb/CreateLogstashConfig.js')
let StartupDBSearch = require('../extdb/StartupDBSearch.js')
let { Helper } = require('helper-clockmaker')
let deepcopy = require('clone')
let debug = require('debug')('InstallAndIndex')

/**
 * This creates a logstash configuration file from the inputs
 * and stores in mongo and then sends to logstash for indexing
 * in elasticsearch
 */
class InstallAndIndex {
  constructor() {
    this.databaseConfig = new CreateDatabaseConfig()
    this.logstashConfig = new CreateLogstashConfig()
  }

  /**
   * Obj is an object that should contain the following,
   * @param username
   * @param filename
   * @param columns
   * @param mapping
   * @param keywords
   * @param filesystem
   */
  create(obj) {
    Helper.hasProperties(
      obj,
      ['username', 'filename', 'columns', 'mapping', 'keywords', 'filesystem'],
      true
    )

    let logstashConfig = new CreateLogstashConfig()

    let lsConfig = {
      csvFilename: obj.filename,
      fields: obj.columns,
      separator: ',',
      useStdIn: true,
      fileDatabase: obj.filesystem,
      user: obj.username,
    }

    let config

    return logstashConfig
      .initialize(lsConfig)
      .then(() => {
        return logstashConfig.writeToMongo(obj.filename, obj.username)
      })
      .then(() => {
        debug('Finished writing logstash config to mongo')

        //Now also create the database configuration
        config = new CreateDatabaseConfig()

        let indexName = logstashConfig.indexName(obj.filename, obj.username)

        let dbObj = deepcopy(obj)
        dbObj.indexName = indexName

        debug('Initializing CreateDatabaseConfig object')
        return config.initialize(dbObj)
      })
      .then(() => {
        debug('Finished initializing config file')
        config.validate()
        return config.writeToMongo(obj.filename, obj.username)
      })
      .then(() => {
        let ls = new StartupDBSearch()

        debug('Started logstash indexer')
        return ls.initializeLogstashFromMongoStdIn(
          obj.filesystem,
          obj.filename,
          obj.username,
          Helper.indexingNoForceWait
        )
      })
      .catch(reason => {
        debug('error', reason)
        return Promise.reject()
      })
  }
}

module.exports = InstallAndIndex
