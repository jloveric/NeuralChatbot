'use strict'

let Logger = require('helper-clockmaker').Logger('StartupDBSearch')
let spawn = require('child_process').spawn
let exec = require('child_process').exec
//let ElasticSearchOperate = require('../extdb/ElasticSearchOperate.js')
let fs = require('fs')
let debug = require('debug')('StartupDBSearch')
let ElasticSearchOperate = require('../extdb/ElasticSearchOperate.js')
let { Helper } = require('helper-clockmaker')

//I want to use this, but it overrides other exit
//handlers so it seems like I need to leave it to the
//main program for now.
//let ExitHandler = require('../etc/ExitHandler.js');

class StartupDBSearch {
  constructor() {
    this.esOp = new ElasticSearchOperate()
  }

  initialize(file) {
    this.initializeElasticSearch()

    let tp = new Promise((resolve, reject) => {
      return this.getElasticsearchIsRunning()
    })
      .then(res => {
        this.initializeLogstash(file)
        return this.getLogstashIsRunning()
      })
      .then(val => {
        return Promise.resolve(true)
      })

    return tp
  }

  initializeElasticsearch() {
    Logger.info('Starting search engine')

    /*this.elasticsearchExit = new ExitHandler(function(){
			this.closeElasticsearch();
		});*/

    this.elasticSearch = spawn('dependencies/elasticsearch/bin/elasticsearch')

    this.esRunning = new Promise((resolve, reject) => {
      Logger.debug('Setting up elasticsearch action')
      this.elasticSearch.stdout.setEncoding('utf8')
      this.elasticSearch.stdout.on('data', function(data) {
        let tString = data.toString()
        if (tString.indexOf('started') > -1) {
          resolve(true)
        }
        Logger.info('Elasticsearch', tString)
      })
    })

    return this.elasticSearch
  }

  /**
   * This version of the logstash call will process the file once
   * and then exit.
   *
   * TODO: It seems this function is never actually called
   *
   * @param filename is the .logstash configuration filename
   * @param databaseName is the name of the database being fed to logstash
   */
  initializeLogstashFromStdIn(filename, databaseName) {
    //Check elasticsearch for index name and remove the index first
    debug('Called initializeLogstashFromStdIn')

    this.logstashFinished = new Promise((resolve, reject) => {
      Logger.info(
        'Starting logging engine with file',
        filename,
        'from stdin database',
        databaseName
      )
      if (!databaseName) {
        Logger.error(
          'Database name must be specified for static logstash start, currently undefined.'
        )
      }

      this.logstash = exec(
        'dependencies/logstash/bin/logstash -f ' +
          filename +
          ' < ' +
          databaseName,
        function(error, stdout, stderr) {
          debug('Starting', filename, 'with', databaseName)

          if (error) {
            Logger.error('Error starting logstash', error)
          }

          if (stdout) {
            Logger.info('Logstash stdout', stdout)
          }

          if (stderr) {
            Logger.error('Logstash stderr', stderr)
          }

          resolve(true)
        }
      )

      this.monitorLogstash()

      //return this.logstash;
    })

    return this.logstashFinished
  }

  /**
   * This version of logstash initialize from the mongo file system
   * using stdin.  Using this approach logstash exits immediately
   * after the data is read.
   * @databaseName is the name of the mongo database
   * @filename is the name of the file (database) that will be indexed
   * @user is the name of the user
   * @options is an object that can contain options
   * {
   * forceIndex : when true forces re-indexing of the data even if the data is indexed
   * returnFast : when true returns without waiting for indexing to complete
   * }
   */
  initializeLogstashFromMongoStdIn(databaseName, filename, user, options) {
    debug('entering initializeLogstashFromMongoStdIn', options)

    //By default do things fast and return before indexing is complete
    if (!options) {
      options = Helper.indexingNoForceNoWait
    }

    debug('New options', options)

    Helper.logAndThrowUndefined('databaseName required', databaseName, true)
    Helper.logAndThrowUndefined('filename required', filename, true)
    Helper.logAndThrowUndefined('user required', user, true)

    debug(
      'Called initializeLogstashFromMongoStdIn',
      databaseName,
      filename,
      user
    )

    let configString = ''
    let MongoFilesystem = require('../extdb/MongoFilesystem.js')

    let mg = new MongoFilesystem()

    this.logstashFinished = new Promise((resolve, reject) => {
      let indexName = Helper.uniqueIndexName(filename, user)

      this.esOp
        .hasIndex(indexName)
        .then(ans => {
          debug('count in index', indexName)

          //If we don't require re-indexing, return if already indexed
          //TODO: obviously it's an issue if there is actually only 1 index
          //In the database or if the last indexing was interupted, but
          //we can force later on
          //if ((ans.count) && (ans.count > 1) && (!options.forceIndex)) {
          debug('RETURNING RAPIDLY')
          resolve()
          return
        })
        .catch(reason => {
          debug('RETURNING SLOWLY', reason, indexName)

          //First get the configuration string
          return mg
            .initialize(databaseName)
            .then(() => {
              return mg.getFileAsText(filename, user, 'logstash')
            })
            .then(ans => {
              //console.log(ans)
              configString = ans
              debug('Got the configuration file', ans)
              debug('reading filestream', filename, user)
              return mg.getReadFileStream(filename, user, 'database')
            })
            .then(fileStream => {
              debug('Got the filestream')
              Logger.info('Starting logging engine with file', filename)
              Logger.info('Configstring', configString)

              this.logstash = spawn(
                'dependencies/logstash/bin/logstash',
                ['-e', configString],
                { stdio: ['pipe', 'pipe', 'pipe'] }
              )

              fileStream.pipe(this.logstash.stdin)

              this.logstash.on('close', code => {
                debug('Closing logstash')
                resolve()
                return
              })

              this.logstash.stdin.on('error', err => {
                //mg.close();
                debug('error, Logstash file read error', err)
                Logger.error('Logstash file read error', err)
                reject()
                return
              })
            })
            .catch(reason => {
              debug('error', reason)
              Logger.error(reason)
              reject()
            })
        })

      console.log('OPTIONS________________________________', options)
      if (options.returnFast) {
        resolve()
        return
      }
    })

    return this.logstashFinished
  }

  /**
   * This version of logstash initialize initializes
   */
  initializeLogstash(filename) {
    Logger.info('Starting logging engine with file', filename)

    this.logstash = spawn(
      'dependencies/logstash/bin/logstash',
      ['-f', filename],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    )

    this.monitorLogstash()

    return this.logstash
  }

  /**
   * Set up debugging messages etc for logstash so that we
   * can record what's happening.
   */
  monitorLogstash() {
    this.logstashRunning = new Promise((resolve, reject) => {
      Logger.debug('Setting up logstash action')

      //I used to be able to show that logstash had started
      //by looking for 'completed' in stderr or stdout.  Unfortunately,
      //now it's not written to these streams, but still appears
      //on the console.  At any rate, I can't use it now so I'm
      //just assuming it's completed when the data arrives.
      this.logstash.stderr.setEncoding('utf8')
      this.logstash.stderr.on('data', function(data) {
        let tString = data.toString()
        //if (tString.indexOf('completed') > -1) {
        //	resolve(true);
        //}
        Logger.debug('Logstash stderr', tString)
      })

      this.logstash.stdout.setEncoding('utf8')
      this.logstash.stdout.on('data', function(data) {
        let tString = data.toString()
        //if (tString.indexOf('completed') > -1) {
        //	resolve(true);
        //}
        Logger.debug('Logstash stdout', tString)
      })

      this.logstash.stdin.setEncoding('utf8')
      this.logstash.stdin.on('data', function(data) {
        let tString = data.toString()
        //if (tString.indexOf('completed') > -1) {
        //	resolve(true);
        //}
        Logger.debug('Logstash stdin', tString)
      })

      resolve(true)
    })
  }

  //Return the promise which is true when 'started' is found
  getElasticsearchIsRunning() {
    return this.esRunning
  }

  getLogstashIsRunning() {
    return this.logstashRunning
  }

  getLogstashFinished() {
    return this.logstashFinished
  }

  getElasticsearch() {
    return this.elasticSearch
  }

  getLogstash() {
    return this.logstash
  }

  closeLogstash() {
    Logger.info('Closing logstash')
    let np = new Promise((resolve, reject) => {
      if (this.logstash) {
        let kill = spawn('kill', ['-9', this.logstash.pid])
        kill.on('error', function(err) {
          Logger.error('Failed to kill logstash: may have already been killed.')
        })

        kill.on('close', function(code, signal) {
          resolve(code)
        })
      } else {
        reject(true)
      }
    })

    return np
  }

  closeElasticsearch() {
    Logger.info('Closing elasticsearch')

    let np = new Promise((resolve, reject) => {
      if (this.elasticSearch) {
        let kill = spawn('kill', ['-9', this.elasticSearch.pid])
        kill.on('error', function(err) {
          Logger.error(
            'Failed to kill elasticsearch: may have already been killed.'
          )
        })
        kill.on('close', function(code, signal) {
          resolve(code)
        })
      } else {
        reject(false)
      }
    })

    return np
  }

  close() {
    this.closeLogstash()
    this.closeElasticsearch()
  }
}

module.exports = StartupDBSearch
