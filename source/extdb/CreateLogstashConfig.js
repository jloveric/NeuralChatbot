'use strict'

let Helper = require('sb/etc/Helper.js')
let fs = require('fs')
let Logger = require('sb/etc/Logger.js')('CreateLogstashConfig')
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let GetConfigValues = require('sb/etc/GetConfigValues.js')

class CreateLogstashConfig {
  constructor() {
    this.gf = new GetConfigValues()
    this.MongoFilesystem = new MongoFilesystem()
  }

  close() {
    this.MongoFilesystem.close()
  }

  /**
   * Initialize the logstash configuration file
   * @param lsConfig is an object which contains the following properties
   * - csvFilename is the name of the csv file, can't be a relative path, no ../../ etc..
   * - fields is a string array of the field names
   * - separator is the separator for the configuration.  For comma delimited this is ','
   * - useStdIn tells whether the input file is read from stdin.  This is a valuable hack
   * - filesystem is the name of the mongodb filesystem if it's being used
   * since this option allows logstash to be shut down immediately after processing the file.  Otherwise
   * logstash runs and re-processes the file until you shut it down.
   * - user is the username which is used to construct the index name
   */
  initialize(lsConfig) {
    if (
      !Helper.hasProperties(lsConfig, [
        'csvFilename',
        'fields',
        'separator',
        'useStdIn',
        'fileDatabase',
        'user',
      ])
    ) {
      Helper.logAndThrow('Logstash config is missing properties')
    }

    let csvFilename = lsConfig.csvFilename
    let fields = lsConfig.fields

    //Forgetting to add appendId is a huge problem so perhaps let
    //the machine do it.  I could see a problem if somebody names
    //it wrong though
    if (!Helper.hasValue(fields, 'appendID')) {
      fields.push('appendID')
    }

    let separator = lsConfig.separator
    let useStdIn = lsConfig.useStdIn
    let filesystem = lsConfig.fileDatabase
    let user = lsConfig.user

    let np = this.MongoFilesystem.initialize(filesystem)

    let filename = Helper.uniqueIndexName(csvFilename, user)
    fields = this.cleanFields(fields)

    if (useStdIn) {
      this.input = 'input {\n\t stdin {}\n}\n'
    } else {
      this.input =
        'input {\n\tfile {\n\t\t path => "' +
        csvFilename +
        '"\n\t\t start_position => "beginning" \n\t\t sincedb_path => "/dev/null" \n\t}\n}\n\n'
    }
    this.filter =
      'filter {\n\t csv { \n\t\tcolumns => [' +
      fields +
      ']\n\t\tseparator=> "' +
      separator +
      '"\n\t}\n}\n\n'
    this.output =
      'output {\n\t elasticsearch {\n\t\t hosts => ["' +
      this.gf.elasticsearch.host +
      '"] \n\t\t document_id => "%{' +
      Helper.extraId +
      '}" \n\t\t index => "' +
      filename +
      '"\n\t}\n}\n\n'

    return np
  }

  indexName(csvFilename, user) {
    let expandName = Helper.uniqueIndexName(csvFilename, user)

    //TODO, this is a relic of when I wrote to disk, so will be able to remove
    //the replace at some point
    return expandName
  }

  cleanFields(fields) {
    for (let i = 0; i < fields.length; i++) {
      //Check if there is a quote
      if (fields[i].indexOf('"') > -1) {
        //Do nothing
      } else {
        //Add quotes
        fields[i] = fields[i]
      }
    }

    return fields
  }

  getConfig() {
    return this.input + this.filter + this.output
  }

  /**
   * Combine components and write to a file
   */
  writeToFile(filename) {
    Logger.info('Creating Logstash configuration shown', this.getConfig())

    let np = new Promise((resolve, reject) => {
      fs.writeFile(filename, this.getConfig(), 'utf8', function(err) {
        if (err) {
          Logger.error('Logstash config write error:', err)
          reject(err)
        }
        resolve(true)
      })
    })

    return np
  }

  writeToMongo(filename, user) {
    console.log('WRITING MONGO TO FILE')
    Logger.info('Writing to mongo file', filename, user)
    let np = this.MongoFilesystem.replaceTextInMongo(
      this.getConfig(),
      filename,
      user,
      'logstash'
    )

    return np
  }
}

module.exports = CreateLogstashConfig
