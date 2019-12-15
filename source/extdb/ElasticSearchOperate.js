'use strict'

let GetConfigValues = require('../etc/GetConfigValues.js')
let Logger = require('helper-clockmaker').Logger('ElasticSearchOperate')
let es = require('elasticsearch')
let debug = require('debug')('ElasticSearchOperate')

/**
 * This class is meant to hold simple operation for elasticsearch.
 */
class ElasticSearchOperate {
  constructor() {
    this.gf = new GetConfigValues()
    this.client = new es.Client({
      host: this.gf.elasticsearch.host,
    })
  }

  deleteIndex(tIndex) {
    return this.client.indices
      .exists({
        index: tIndex,
      })
      .then(ans => {
        debug('deleting index', ans)
        return Promise.resolve(ans)
      })
      .catch(err => {
        return Promise.resolve(err)
      })
  }

  countIndexEntries(tIndex) {
    debug('counting index entries', tIndex)
    let np = new Promise((resolve, reject) => {
      this.client.count(
        {
          index: tIndex,
        },
        (err0, response) => {
          if (response) {
            resolve(response)
          } else {
            reject(err0)
          }
        }
      )
    })

    return np
  }

  hasIndex(tIndex) {
    debug('Checking if hasIndex', tIndex)

    //debug('exists', exists)
    return this.client.indices
      .exists({
        index: tIndex,
      })
      .then(ans => {
        debug('hasIndex ans------------------------------', ans)
        if (ans) {
          return Promise.resolve(true)
        }
        return Promise.reject()
      })
      .catch(err => {
        return Promise.reject(err)
      })
  }
}

module.exports = ElasticSearchOperate
