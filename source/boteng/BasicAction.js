'use strict'

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('BasicAction')
let { Helper } = require('helper-clockmaker')
let debug = require('debug')('BasicAction')
let deepcopy = require('clone')

class BasicAction extends Action {
  constructor() {
    super()
    this.name = 'BasicAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    //Not totally sure about this one
    return true
  }

  /**
   * Compute the input given this filter
   */
  async computeResult(input, userData, scoreBasedOnSearch) {
    Helper.hasProperties(input, ['replies', 'wildcards'])

    let field = this.primary
    let replies = input.replies
    let search = input.search
    let wildcards = input.wildcards

    debug('INPUT--------------------------', input)

    let replyTemplate = Helper.selectRandom(replies)
    debug('ReplyTemplate', replyTemplate, wildcards)
    let target = replyTemplate.target[0]
    debug('wildcards[target]', wildcards[target])
    
    //The old method searched a database for the wildcard
    //let result = await this.search.searchAndScore(wildcards[target], field)
    
    //Now we set it to empty as there is no search
    let result = []
    
    debug('result', result)


    try {
      debug('Returning from the promise!', result.length)

      if (!result.length) {
        let phrase = wildcards[target]
        phrase.match(Helper.tokenize)
        let tLength = Math.max(1, phrase.length)

        let badScore = { exact: 0, score: 0, order: 0, size: 1.0 / tLength }
        let newScore = Helper.combineSimilarity(badScore, input.score)

        let resp = Formatting.negative({
          replyTemplate: replyTemplate,
          wildcards: wildcards,
          results: result,
          confidence: newScore.score * newScore.order * newScore.size,
          score: badScore,
        })

        debug('Response', resp)
        return resp
      }

    } catch (reason) {

      Logger.warn('Error in search', reason)
      return Helper.failResponse
    }
  }
}

module.exports = BasicAction
