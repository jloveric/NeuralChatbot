'use strict'
let es = require('elasticsearch')
let SingleResponseIfc = require('./SingleResponseIfc.js').SingleResponseIfc
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let Logger = require('sb/etc/Logger.js')('ElasticSearchQuery')
let Helper = require('sb/etc/Helper.js')
let debug = require('debug')('ElasticSearchQuery')
let deepcopy = require('clone')
let similarity = require('sb/phrasex/SentenceSimilarity.js')
let commonScore = require('sb/phrasex/SimilarityScore.js').commonScore
let GetDataConfig = require('sb/etc/GetDataConfig.js')

/**
 * This class takes some searchText and passes it through elastic
 * search to obtain a result.  The format of the result is defined
 * in the class 'format' so it can be modified depending on what
 * data is given in your database.
 */
class EsearchResultsQuery extends SingleResponseIfc {
  constructor() {
    super()
    this.gc = new GetConfigValues()
    this.config = new GetDataConfig()
  }

  /**
   * TODO: this really needs to be cleaned up.  Because it is derived from SingleResponseIfc
   * it requires a configuration file with a bunch of un-necessary stuff, it really only
   * needs indexName...  At any rate, we should probably decouple from SingleResponse as
   * a result.
   */
  initialize(confShallow, indexName) {
    this.indexName = indexName

    let conf = deepcopy(confShallow)

    //let p0 = this.config.initialize(conf);

    let p = Promise.resolve()
    if (!this.indexName) {
      p = this.config.initialize(conf)
    }

    //Then this
    let np = new Promise((resolve, reject) => {
      p.then(() => {
        if (!this.indexName) {
          this.indexName = this.config.indexName
        }

        this.elasticsearch = es
        this.ESNotRunning = 'query database not running'
        this.searchResult = ''
        this.client = new this.elasticsearch.Client({
          host: this.gc.elasticsearch.host,
        })
        resolve()
      }).catch(reason => {
        Logger.error('Elasticsearch initialization failure', reason)
      })
    })

    return np
  }

  close() {
    this.client.close()
  }

  returnN(maxNumber) {
    let query = {
      index: this.indexName,
      size: maxNumber,
      body: {
        query: {
          match_all: {},
        },
      },
    }

    //Logger.warn('Using query', query);

    //let self = this;
    let np = new Promise((resolve, reject) => {
      //First check that the index exists
      this.client.indices.exists({ index: this.indexName }, (error, exists) => {
        if (error) {
          Logger.error(
            'Check if index exists error',
            this.indexName,
            'error',
            error
          )
          reject(error)
        }

        //If it exists then perform a search
        if (exists) {
          Logger.debug(query)
          let res = this.client.search(query)
          res
            .then(
              function(body) {
                //Logger.debug('found these matches', body)
                resolve(body.hits.hits)
              },
              function(error) {
                Logger.error('Search error', error)
                reject(error)
              }
            )
            .catch(function(reason) {
              Logger.error('Search Fails', reason)
              reject(error)
            })
        } else {
          Logger.error(
            'The elasticsearch index',
            this.indexName,
            'does not exist'
          )
          reject(error)
        }
      })
    })

    return np
  }

  searchAndScore(searchText, fields) {
    if (searchText == '' || !searchText) {
      //throw "Search text is null so exiting."
      Logger.warn(
        'Search text is null: probably a problem in your search call.'
      )
      return Promise.reject('Empty search text')
    }

    let np = new Promise((resolve, reject) => {
      let searchArray = searchText.match(Helper.tokenize)

      this.searchFields(searchText, fields)
        .then(res => {
          for (let i = 0; i < res.length; i++) {
            let hl = Helper.highlightedFields(res[i].highlight)
            Logger.debug('highlight', res[i].highlight)
            Logger.debug('hl', hl)
            Logger.debug('hl[0]', hl[0])
            //assume match in the first field

            let match = Helper.getObjElement(res[i]._source, hl[0])

            //let match = res[i]._source[hl[0]]
            Logger.debug('match', match)

            //console.log('match',match)
            let matchArray = match.match(Helper.tokenize)
            Logger.debug('matchArray', matchArray)

            let matchScore = similarity(searchArray, matchArray, commonScore)
            res[i].score = matchScore
          }

          debug('RES', res)
          //similarity(a, b, commonScore)
          resolve(res)
        })
        .catch(reason => {
          reject(reason)
        })
    })
    return np
  }

  /*searchAndScore(searchText, fields) {

		if ((searchText == "") || (!searchText)) {
			//throw "Search text is null so exiting." 
			Logger.warn("Search text is null: probably a problem in your search call.");
			return Promise.reject('Empty search text')
		}

		let np = new Promise((resolve, reject) => {

			let searchArray = searchText.match(Helper.tokenize);

			this.searchFields(searchText, fields).then((res) => {

				let oldMatch = null;
				let oldScore = null;
				for (let i = 0; i < res.length; i++) {
					let hl = Helper.highlightedFields(res[i].highlight)
					Logger.debug('highlight', res[i].highlight)
					Logger.debug('hl', hl)
					Logger.debug('hl[0]', hl[0])
					//assume match in the first field

					let match = Helper.getObjElement(res[i]._source, hl[0])
					if (match == oldMatch) {
						res[i].score = deepcopy(oldScore)
					} else {

						//let match = res[i]._source[hl[0]]
						Logger.debug('match', match)

						//console.log('match',match)
						let matchArray = match.match(Helper.tokenize);
						Logger.debug('matchArray', matchArray)

						let matchScore = similarity(searchArray, matchArray, commonScore)
						res[i].score = matchScore

						oldScore = deepcopy(matchScore);
						oldMatch = matchScore;
					}
				}

				debug('RES', res)
				//similarity(a, b, commonScore)
				resolve(res);
			}).catch((reason) => {
				reject(reason)
			})
		})
		return np;
	}*/

  searchAndBoost(searchText, fields, optionsIn) {
    let np = new Promise((resolve, reject) => {
      debug('searchTerm', searchText, 'fields', fields, 'options', optionsIn)
      this.searchFields(searchText, fields, optionsIn).then(ans => {
        debug('searchAndBoost ans', ans)

        if (!ans[0]) {
          return resolve('no match so no boost')
        }

        let id = ans[0]._id
        let type = ans[0]._type
        let body = ans[0]._source
        //body.boostRank = body.boostRank ? (body.boostRank++) : 1
        body.boostRank = 1

        debug('body', body)

        this.client
          .index({
            index: this.indexName,
            type: type,
            id: id,
            body: body,
          })
          .then(() => {
            resolve()
          })
          .catch(reason => {
            Logger.error(reason)
            reject(reason)
          })
      })
    })
  }

  removeBoost(optionsIn) {
    let options = optionsIn ? optionsIn : {}

    debug('IndexName', this.indexName)

    let query = {
      index: this.indexName,
      size: options.numResults
        ? options.numResults
        : this.gc.elasticsearch.boostResults,
      searchType: 'dfs_query_then_fetch',
      body: {
        explain: false,
        query: {
          constant_score: {
            filter: {
              term: {
                boostRank: 1,
              },
            },
          },
        },
      },
    }

    //let self = this;
    let np = new Promise((resolve, reject) => {
      //First check that the index exists
      this.client.indices.exists({ index: this.indexName }, (error, exists) => {
        debug('does', this.indexName, 'exist', exists)

        if (error) {
          Logger.error(
            'Check if index exists error',
            this.indexName,
            'error',
            error
          )
          reject(error)
          return
        }

        //If it exists then perform a search
        if (exists) {
          Logger.debug(query)
          let res = this.client.search(query)

          let prom = []
          res.then(body => {
            let hits = body.hits.hits

            for (let i = 0; i < hits.length; i++) {
              let id = hits[i]._id
              let tBody = hits[i]._source
              let type = hits[i]._type
              delete tBody.boostRank

              debug('NEW tBody', tBody)

              prom.push(
                this.client.index({
                  index: this.indexName,
                  type: type,
                  id: id,
                  body: tBody,
                })
              )
            }

            if (prom.length) {
              return Promise.all(prom)
                .then(() => {
                  resolve()
                })
                .catch(reason => {
                  reject(reason)
                })
            } else {
              resolve()
            }
          })
        } else {
          Logger.error(
            'The elasticsearch index',
            this.indexName,
            'does not exist'
          )
          reject('The elasticsearch index does not exist')
        }
      })
    })

    return np
  }

  //All the rest are unique to this class
  searchFields(searchText, fields, optionsIn) {
    let options = optionsIn ? optionsIn : {}

    debug(
      'Searching for',
      searchText,
      'in',
      this.indexName,
      'fields',
      fields,
      'num results',
      this.gc.elasticsearch.numResults
    )

    //console.log("This searchText",searchText);
    if (searchText == '' || !searchText) {
      //throw "Search text is null so exiting."
      Logger.warn(
        'Search text is null: probably a problem in your search call.'
      )
      return Promise.reject('Empty search text')
    }

    debug('IndexName', this.indexName)

    let query = {
      index: this.indexName,
      size: options.numResults
        ? options.numResults
        : this.gc.elasticsearch.numResults,
      searchType: 'dfs_query_then_fetch',
      body: {
        explain: false,
        highlight: {
          fields: {
            '*': {
              force_source: true,
            },
          },
          require_field_match: true,
        },
        query: {
          multi_match: {
            fields: fields,
            query: searchText,
            fuzziness: 'AUTO',
          },
        },
      },
    }

    //let self = this;
    let np = new Promise((resolve, reject) => {
      //First check that the index exists
      this.client.indices.exists({ index: this.indexName }, (error, exists) => {
        debug('does', this.indexName, 'exist', exists)

        if (error) {
          Logger.error(
            'Check if index exists error',
            this.indexName,
            'error',
            error
          )
          reject(error)
          return
        }

        //If it exists then perform a search
        if (exists) {
          Logger.debug(query)
          let res = this.client.search(query)
          res
            .then(
              body => {
                debug('result', body)
                //Reduce the number of hits 	by only taking
                //scores that match the best score.

                let hits = body.hits.hits
                if (options.topScoresOnly) {
                  hits = Helper.topScores(body.hits.hits)
                }

                debug('hits', hits)
                Logger.debug('found these top matches', body)
                resolve(hits)
              },
              function(error) {
                Logger.error('Search error', error)
                reject(error)
              }
            )
            .catch(function(reason) {
              Logger.error('Search Fails', reason)
              reject(reason)
            })
        } else {
          Logger.error(
            'The elasticsearch index',
            this.indexName,
            'does not exist'
          )
          reject('The elasticsearch index does not exist')
        }
      })
    })

    return np
  }
}

module.exports = EsearchResultsQuery
