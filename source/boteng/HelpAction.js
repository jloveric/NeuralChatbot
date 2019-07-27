"use strict";

let Action = require("sb/boteng/Action.js");
let Formatting = require("sb/boteng/Formatting.js");
let Logger = require("sb/etc/Logger.js")("HelpAction");
let Helper = require("sb/etc/Helper.js");
let formatHelp = require("sb/etc/FormatHelp.js");

class HelpAction extends Action {
  constructor() {
    super();
    this.name = "HelpAction";
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ["source"]);
    return input.source.phraseType == "help";
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    return Promise.resolve({
      response: formatHelp(input.doc.description),
      confidence: input.confidence,
      success: true
    });
  }
}

module.exports = HelpAction;
