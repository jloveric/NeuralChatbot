'use strict'

let EsSearch = require('../response/ElasticSearchQuery.js')
let MongoFilesystem = require('../extdb/MongoFilesystem.js')
let debug = require('debug')('BoostDocuments')

class BoostDocuments {
  constructor() {
    this.es = new EsSearch()
    this.mf = new MongoFilesystem()
  }

  initialize(confShallow) {
    this.conf = confShallow

    let p0 = this.mf.initialize(this.conf.fileDatabase)
    let p1 = this.es.initialize(confShallow, this.conf.indexName)

    return Promise.all([p0, p1])
  }

  boost(filename) {
    debug('Stepping into boost', filename)

    return this.mf
      .getFileAsText(filename, this.conf.user, 'boost')
      .then(ans => {
        let pList = []

        ans = ans.split('\n')
        debug('File as text', ans, ans.length)
        for (let i = 0; i < ans.length; i++) {
          pList.push(
            this.es.searchAndBoost(ans[i], this.conf.primary, { numResults: 1 })
          )
        }
        debug('returning')
        return Promise.all(pList)
      })
  }

  /**
   * Remove all the boosted items
   * @param options is optional
   */
  clearBoost(options) {
    return this.es.removeBoost(options)
  }
}

module.exports = BoostDocuments
