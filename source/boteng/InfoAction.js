'use strict'

let Action = require('../boteng/Action.js')
let Formatting = require('../boteng/Formatting.js')
let Logger = require('helper-clockmaker').Logger('InfoAction')
let {Helper} = require('helper-clockmaker')
let formatHelp = require('../etc/FormatHelp.js')

class InfoAction extends Action {
  constructor() {
    super()
    this.name = 'InfoAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ['source'])
    return input.source.phraseType == 'info'
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    return Promise.resolve({
      response: formatHelp(input.doc.description, 'info'),
      confidence: input.confidence,
      success: true,
    })
  }
}

module.exports = InfoAction
