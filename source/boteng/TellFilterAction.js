'use strict'

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('NoSearchAction')
let { Helper } = require('helper-clockmaker')

/**
 * This action returns true for every phrase so should
 * not be included in the botEngine list.  Instead it is
 * used independtly to just check the result when the
 * data is filled with known wildcards.
 */
class TellFilterAction extends Action {
  constructor() {
    super()
    this.name = 'TellFilterAction'
    this.options = ['got it', 'ok', 'cool', 'I see', 'uh huh']
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    return input.source.phraseType == 'tell'
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    let replies = input.replies
    let wildcards = input.wildcards

    let replyTemplate = Helper.selectRandom(replies)

    return Promise.resolve(
      {
        response: Helper.selectRandom(this.options),
        wildcards: [wildcards],
        phrase: '',
        success: true,
        confidence: input.confidence,
        dontRespond: false,
        slotScore: 0,
      },
      userData
    )
  }
}

module.exports = TellFilterAction
