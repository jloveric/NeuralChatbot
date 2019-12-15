'use strict'

let Action = require('./Action.js')
let Formatting = require('./Formatting.js')
let Logger = require('helper-clockmaker').Logger('HelpAction')
let {Helper} = require('helper-clockmaker')
let formatHelp = require('../etc/FormatHelp.js')

class DynamicAction extends Action {
  constructor() {
    super()
    this.name = 'PrivacyAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ['source'])
    return input.source.phraseType == 'dynamic'
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    //Require an exact match to let this pass
    let success = true
    if (input.source.exact) {
      if (input.confidence < 1.0) {
        input.confidence = 0.0
        success = false
      }
    }

    let response = success ? input.source.output : ''
    return Promise.resolve({
      response: response,
      confidence: input.confidence,
      success: success,
    })
  }
}

module.exports = DynamicAction
