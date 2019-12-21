'use strict'

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('WhatDidISayAction')
let { Helper } = require('helper-clockmaker')
let slotFiller = require('slot-filler')
let debug = require('debug')('WhatDidISayAction')

class WhatDidISayAction extends Action {
  constructor() {
    super()
    this.name = 'WhatDidISayAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    debug('At least I should have passed this fileter')
    Helper.hasProperties(input, ['source'])
    if (input.source.meta) {
      return Helper.matchesRegex(input.source.meta.group, 'whatsaid')
    }
    return false
  }

  /**
   * Compute the input given this filter
   */
  async computeResult(input, userData) {
    debug('Computing result for WhatDidISayAction')

    let hist = userData.history.toArray()

    debug('hist', hist)
    if (hist.length > 1) {
      let previousQuestion = hist[1]
      debug('hist', hist)
      let source = previousQuestion.source
      let phrase = source.phrase
      let wildcards = previousQuestion.wildcards
      let ans = slotFiller.reconstructPhrase(phrase, wildcards).phrase
      return {
        response: ans,
        wildcards: [wildcards],
        phrase: source,
        confidence: input.confidence,
        success: true,
        slotScore: 0,
      }
    }
  }
}

module.exports = WhatDidISayAction
