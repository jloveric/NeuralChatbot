"use strict";

let Action = require("sb/boteng/Action.js");
let Formatting = require("sb/boteng/Formatting.js");
let Logger = require("sb/etc/Logger.js")("NoInfoAction");
let Helper = require("sb/etc/Helper.js");

/**
 * This action is applied to broad questions such
 * as "Who is available".  No wildcards can be extracted
 * and instead the implies keyword is used and many results
 * can be returned.
 */
class NoInfoAction extends Action {
  constructor() {
    super();
    this.name = "NoInfoAction";
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    //Not totally sure about this one
    Helper.hasProperties(input, ["source"]);
    return Helper.containsRegex(input.source.meta.style, "noInfo");
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    Helper.hasProperties(input, ["replies", "wildcards"]);

    let field = "_all";
    let replies = input.replies;
    let search = input.search;
    let wildcards = input.wildcards;

    let replyTemplate = Helper.selectRandom(replies);
    Logger.debug("ReplyTemplate", replyTemplate);
    let prom = this.search.returnN(10);

    return prom
      .then(result => {
        //Logger.warn('results',result.hits.hits)
        //let final = this.formatResults(replyTemplate, wildcards, result)
        let final = Formatting.databaseContents(
          {
            replyTemplate: replyTemplate,
            wildcards: wildcards,
            results: result,
            columnMap: this.columnMap,
            columnType: this.columnType,
            columnSynVector: this.columnSynVector,
            confidence: input.confidence,
            columnReName: input.columnReName
          },
          userData
        );

        if (final.response.match(/undefined/i)) {
          final.response = "";
        }
        return Promise.resolve(final);
      })
      .catch(reason => {
        Logger.warn("Error in search", reason);
        return Promise.resolve(Helper.failResponse);
      });
  }
}

module.exports = NoInfoAction;
