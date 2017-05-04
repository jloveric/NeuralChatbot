"use strict"

let Action = require('sb/boteng/Action.js')
let Formatting = require('sb/boteng/Formatting.js')
let Logger = require('sb/etc/Logger.js')('HelpAction')
let Helper = require('sb/etc/Helper.js')
let formatHelp = require('sb/etc/FormatHelp.js')

class PrivacyAction extends Action {
  constructor() {
    super();
    this.name = 'PrivacyAction'
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ['source'])
    return (input.source.phraseType == 'privacy')
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

    let response = success ? "<p>Here is the privacy policy <br><iframe src=https://storeai.mekanite.com/storeAiPrivacy.html>Could not load the policy</iframe></p>" : '';
    return Promise.resolve(
      { response: response, confidence: input.confidence, success: success })


  }
}

module.exports = PrivacyAction;