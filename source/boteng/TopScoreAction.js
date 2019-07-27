"use strict";

let Action = require("sb/boteng/Action.js");
let Formatting = require("sb/boteng/Formatting.js");
let Logger = require("sb/etc/Logger.js")("BasicAction");
let Helper = require("sb/etc/Helper.js");
let SentenceSimilarity = require("sb/phrasex/SentenceSimilarity.js");
let reSort = require("sb/phrasex/ReRank.js").reSort;
let debug = require("debug")("TopScoreAction");
let deepcopy = require("clone");

class TopScoreAction extends Action {
  constructor() {
    super();
    this.name = "TopScoreAction";
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    //Not totally sure about this one
    Helper.hasProperties(input, ["source"]);
    return input.source.meta.group == "request bot";
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData) {
    Helper.hasProperties(input, ["replies", "wildcards"]);

    let field = this.primary;
    let replies = input.replies;
    let search = input.search;
    let wildcards = input.wildcards;

    let replyTemplate = Helper.selectRandom(replies);
    Logger.debug("ReplyTemplate", replyTemplate, wildcards);
    let target = replyTemplate.target[0];
    Logger.debug("wildcards[target]", wildcards[target]);
    let prom = this.search.searchAndScore(wildcards[target], field);

    let final = {};

    return prom
      .then(result => {
        //Compute a search score

        //Assumes the results are sorted by the highest match score
        let searchConfidence = 0;
        if (result[0]) {
          let tScore =
            result[0].score.score *
            result[0].score.size *
            result[0].score.order;
          searchConfidence = result[0].score.score
            ? result[0].score.score
            : 0.0;
        }
        /*for (let i = 0; i < result.length; i++) {
        let score = result[i].matchScore;
        let confidence = score.score;

        if (confidence > searchConfidence) searchConfidence = confidence;
      }*/

        debug("searchAndScore results", result);
        debug("searchConfidence", searchConfidence);

        let sResult = [];
        if (result[0]) {
          sResult.push(result[0]);
        }
        //Logger.warn('results',result.hits.hits)
        //let final = this.formatResults(replyTemplate, wildcards, result)
        final = Formatting.standard(
          {
            replyTemplate: replyTemplate,
            wildcards: wildcards,
            results: sResult,
            columnMap: this.columnMap,
            columnType: this.columnType,
            columnSynVector: this.columnSynVector,
            columnReName: this.columnReName,
            confidence: input.confidence * searchConfidence
          },
          userData
        );

        if (final.response.match(/undefined/i)) {
          //Helper.failResponse;
          final = Object.assign(final, Helper.failResponse);
        }

        return Promise.resolve(final);
      })
      .catch(reason => {
        Logger.warn("Error in search", reason);
        return Promise.resolve(Helper.failResponse);
      });
  }
}

module.exports = TopScoreAction;
