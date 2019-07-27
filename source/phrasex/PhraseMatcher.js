"use strict";

let Logger = require("sb/etc/Logger.js")("PhraseMatcher");
let es = require("elasticsearch");
let levenshtein = require("fast-levenshtein");
let Helper = require("sb/etc/Helper.js");
let reRank = require("sb/phrasex/ReRank.js").reRank;
let GetConfigValues = require("sb/etc/GetConfigValues.js");

//TODO: Not sure this does anything important anymore.
class PhraseMatcher {
  constructor() {
    this.elasticsearch = es;
    this.gf = new GetConfigValues();

    //TODO: it seems like I should be using my
    //elasticsearch wrapper here.
    this.client = new this.elasticsearch.Client({
      host: this.gf.elasticsearch.host
    });
  }

  close() {
    this.client.close();
  }

  /**
   * Get the wildcards for a given phrase
   * @param phrase is the phrase passed in, example "Where are the the hash browns".
   * @param keywords are special words to help differentiate neighboring
   * wildcards where one wildcard is a keyword
   * @return the promise containing the source and the wildcards.
   */
  getWildcardsAndMatch(phrase, keywords) {}
}

module.exports = PhraseMatcher;
