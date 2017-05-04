"use strict"

let Action = require('sb/boteng/Action.js')
let Formatting = require('sb/boteng/Formatting.js')
let Logger = require('sb/etc/Logger.js')('HelpAction')
let Helper = require('sb/etc/Helper.js')
let formatHelp = require('sb/etc/FormatHelp.js')

class ListAction extends Action {
  constructor() {
    super();
    this.name = 'ListAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ['source'])
    return (input.source.phraseType == 'list')
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {

    //Require an exact match to let this pass
    let success = true;
    if (input.confidence < 1.0) {
      input.confidence = 0.0;
      success = false;
    }

    if (input.source.meta.group == "delete list") {
      let response = success ? "The list has been deleted" : '';
      return Promise.resolve(
        { response: response, deleteList: success, confidence: input.confidence, success: success })

    } else {
      let response = success ? "Here it is!" : '';

      return Promise.resolve(
        { response: response, showList: success, confidence: input.confidence, success: success })

    }
  }
}

module.exports = ListAction;