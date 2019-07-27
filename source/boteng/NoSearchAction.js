"use strict";

let Action = require("sb/boteng/Action.js");
let Formatting = require("sb/boteng/Formatting.js");
let Logger = require("sb/etc/Logger.js")("NoSearchAction");
let Helper = require("sb/etc/Helper.js");

class NoSearchAction extends Action {
  constructor() {
    super();
    this.name = "NoSearchAction";
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    Helper.hasProperties(input, ["typeIdentifier"]);
    return input.typeIdentifier.match(/nosearch/i);
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    let replies = input.replies;
    let wildcards = input.wildcards;

    let replyTemplate = Helper.selectRandom(replies);

    return Promise.resolve(
      Formatting.none(
        {
          replyTemplate: replyTemplate,
          wildcards: wildcards,
          confidence: input.confidence
        },
        userData
      )
    );
  }
}

module.exports = NoSearchAction;
