'use strict'
let Startup = require('sb/extdb/StartupDBSearch.js')
let ElasticSearchOp = require('sb/extdb/ElasticSearchOperate.js')
let debug = require('debug')
let Helper = require('sb/etc/Helper.js')
let InstallBot = require('sb/extdb/InstallBot.js')
let GetConfigValues = require('sb/etc/GetConfigValues.js')

let fs = 'filesystem'

describe('StartupDBSearch', function() {
  it('Should create elasticsearch index', function(done) {
    let su = new Startup()

    //let filename = 'dependencies/sqlite-connector/sqliteSb.config';
    let filename = 'uploads/gTest.csv.logstash.static'
    let databaseName = 'uploads/gTest.csv'
    let ls = su.initializeLogstashFromStdIn(filename, databaseName)

    ls.then(function(val) {
      console.log('Logstash completed startup')
      expect(true).toBeTruthy()
      //su.closeLogstash();
      done()
    })
  }, 50000)

  it('Should start up elasticsearch', function(done) {
    let su = new Startup()

    let es = su.initializeElasticsearch()

    let running = su.getElasticsearchIsRunning()
    running.then(function(ans) {
      console.log('Elastic search completed startup')
      expect(true).toBeTruthy()
      su.closeElasticsearch()
      done()
    })
  }, 50000)

  //Need to use different database name
  it('Should start up logstash', function(done) {
    let su = new Startup()

    //let filename = 'dependencies/sqlite-connector/sqliteSb.config';
    let filename = 'uploads/gTest.csv.config'
    let ls = su.initializeLogstash(filename)

    let running = su.getLogstashIsRunning()
    running.then(function(val) {
      console.log('Logstash completed startup')
      expect(true).toBeTruthy()
      su.closeLogstash()
      done()
    })
  }, 50000)

  it('Should start up logstash from mongo filesystem', function(done) {
    let tName = 'john.loverich@gmail.common'

    let ib = new InstallBot()

    ib.install(tName, 'nwepwd', 'uploads/file.install')
      .then(() => {
        console.log('finished logstash')
        let es = new ElasticSearchOp()
        return es.countIndexEntries('groceries.csv.' + tName)
      })
      .then(res => {
        console.log('RES', res)
        expect(res.count).toEqual(158)
        done()
      })
      .catch(reason => {
        console.log('ERROR', reason)
        expect(false).toBeTruthy()
        done()
      })
  }, 50000)
})
