'use strict'

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('BasicAction')
let {Helper} = require('helper-clockmaker')
let reSort = require('neural-phrasex').ReRank.reSort
let debug = require('debug')('MoreBasicAction')

class MoreBasicAction extends Action {
  constructor() {
    super()
    this.name = 'MoreBasicAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ['source'])
    return input.source.phraseType == 'continue'
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    debug('Inside MoreBasicAction!')

    let result = userData.getNextSearchResults(10)
    let obj = userData.getLastReply()

    debug('result is', result)
    debug('obj is', obj)

    if (result.result.length > 0) {
      let final = Formatting.standard(
        {
          replyTemplate: obj.replyTemplate,
          wildcards: obj.wildcards,
          results: result.result,
          columnMap: this.columnMap,
          columnType: this.columnType,
          columnSynVector: this.columnSynVector,
          columnReName: this.columnReName,
          confidence: 1.0, //<-------------------TODO: pretty sure setting conf to 1 is correct since they want more
        },
        userData
      )

      if (result.result.length >= 10) {
        final.response = final.response + '\n' + Helper.moreResponse
        final.searchResult.push({ hasMore: true })
      }

      if (final.response.match(/undefined/i)) {
        //Helper.failResponse;
        final = Object.assign(final, Helper.failResponse)
      }

      debug('The result is', final)
      return Promise.resolve(final)
    }

    return Promise.resolve({
      response: 'No more results!',
      success: true,
      confidence: 1.0,
    })
  }
}

module.exports = MoreBasicAction
