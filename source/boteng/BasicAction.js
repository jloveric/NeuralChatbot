"use strict";

let Action = require("sb/boteng/Action.js");
let Formatting = require("sb/boteng/Formatting.js");
let Logger = require("sb/etc/Logger.js")("BasicAction");
let Helper = require("sb/etc/Helper.js");
let SentenceSimilarity = require("sb/phrasex/SentenceSimilarity.js");
let reSort = require("sb/phrasex/ReRank.js").reSort;
let boostSort = require("sb/phrasex/ReRank.js").boostSort;
let debug = require("debug")("BasicAction");
let deepcopy = require("clone");

class BasicAction extends Action {
  constructor() {
    super();
    this.name = "BasicAction";
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {
    //Not totally sure about this one
    return true;
  }

  /**
   * Compute the input given this filter
   */
  computeResult(input, userData, scoreBasedOnSearch) {
    Helper.hasProperties(input, ["replies", "wildcards"]);

    let field = this.primary;
    let replies = input.replies;
    let search = input.search;
    let wildcards = input.wildcards;

    debug("INPUT--------------------------", input);

    let replyTemplate = Helper.selectRandom(replies);
    Logger.debug("ReplyTemplate", replyTemplate, wildcards);
    let target = replyTemplate.target[0];
    Logger.debug("wildcards[target]", wildcards[target]);
    let prom = this.search.searchAndScore(wildcards[target], field);

    return prom
      .then(result => {
        debug("Returning from the promise!", result.length);

        if (!result.length) {
          let phrase = wildcards[target];
          phrase.match(Helper.tokenize);
          let tLength = Math.max(1, phrase.length);

          let badScore = { exact: 0, score: 0, order: 0, size: 1.0 / tLength };
          let newScore = Helper.combineSimilarity(badScore, input.score);

          let resp = Formatting.negative({
            replyTemplate: replyTemplate,
            wildcards: wildcards,
            results: result,
            confidence: newScore.score * newScore.order * newScore.size,
            score: badScore
          });

          debug("Response", resp);
          return Promise.resolve(resp);
        }

        //Compute a search score
        let searchConfidence = 0;

        let bestScore = result[0].score;
        for (let i = 0; i < result.length; i++) {
          let score = result[i].score;
          let confidence = score.score * score.size * score.order;
          //let confidence = score.score;

          if (confidence > searchConfidence) {
            searchConfidence = confidence;
            bestScore = result[i].score;
          }
        }

        //We need this available in case the user asks for more data as this saves
        //the results, the response template and wildcards necessary to produce, "more".
        //For various reason, this needs to be returned.

        result = reSort(result);
        result = boostSort(result);

        debug("searchAndScore results", result);
        debug("searchConfidence", searchConfidence);

        let moreAction = {
          result: deepcopy(result),
          replyTemplate: deepcopy(replyTemplate),
          wildcards: deepcopy(wildcards),
          startOffset: 10
        };

        let sResult = [];
        for (let i = 0; i < Math.min(10, result.length); i++) {
          sResult.push(result[i]);
        }

        let newScore = bestScore;
        if (!scoreBasedOnSearch) {
          newScore = Helper.combineSimilarity(bestScore, input.score);
        }

        debug("newScore", newScore);
        //Logger.warn('results',result.hits.hits)
        //let final = this.formatResults(replyTemplate, wildcards, result)
        let final = Formatting.standard(
          {
            replyTemplate: replyTemplate,
            wildcards: wildcards,
            results: sResult,
            columnMap: this.columnMap,
            columnType: this.columnType,
            columnSynVector: this.columnSynVector,
            columnReName: this.columnReName,
            confidence: newScore.score * newScore.order * newScore.size,
            score: newScore
          },
          userData
        );

        if (result.length > 10 && final.success) {
          final.response = final.response + "\n" + Helper.moreResponse;
          final.searchResult.push({ hasMore: true });
        }

        final.moreAction = moreAction;

        if (final.response.match(/undefined/i) || final.response == "") {
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

module.exports = BasicAction;
