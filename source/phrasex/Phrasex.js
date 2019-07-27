"use strict";

let Logger = require("sb/etc/Logger.js")("Phrasex");
let es = require("elasticsearch");
let levenshtein = require("fast-levenshtein");
let Helper = require("sb/etc/Helper.js");
let reRank = require("sb/phrasex/ReRank.js").reRank;
let GetConfigValues = require("sb/etc/GetConfigValues.js");
let PhraseMatcher = require("sb/phrasex/PhraseMatcher.js");
let PhraseHitsFilterFactory = require("sb/phrasex/PhraseHitsFilter.js");
let similarity = require("sb/phrasex/SentenceSimilarity.js");
let similarityScore = require("sb/phrasex/SimilarityScore.js");
let slotFiller = require("sb/phrasex/SlotFiller.js");

let debug = require("debug")("Phrasex");

/**
 * This class is the phrase matcher and uses the slotFiller with specific phrases.
 * It also performs various other actions and has phrase filters etc...  In particular,
 * this class can match the phrase "Do you have tacos" with the elastic search match
 * "Do you have (item)" and then resolve {item : 'tacos'}
 */
class Phrasex extends PhraseMatcher {
  constructor() {
    super();
    this.hitsFilter = PhraseHitsFilterFactory("NoPhraseFilter");
    this.database = "phrasedb";
  }

  /**
   * Initialize with options
   * options = null or
   * options = {database : something} where database is an alternative to using
   * the phrasedb.
   */
  initialize(options) {
    if (!options) {
      this.database = "phrasedb";
    } else if (!options.database) {
      this.database = "phrasedb";
    } else {
      this.database = options.phraseTable;
    }
  }

  setHitsFilter(val) {
    this.hitsFilter = val;
  }

  filterResults(equalList) {
    //if(!equalList.length) return null;
    try {
      let tellList = [];
      let otherList = [];
      for (let i = 0; i < equalList.length; i++) {
        debug("checking loop", equalList[i].result._source);
        if (equalList[i].result._source.phraseType == "tell") {
          tellList.push(equalList[i]);
        } else {
          otherList.push(equalList[i]);
        }
      }

      //otherList.push.apply(otherList, tellList)
      otherList = otherList.concat(tellList);
      debug("equalList", equalList);
      debug("otherList-------------", otherList);

      return otherList;
    } catch (e) {
      debug("TOTALLY JACKED_________________________________");
    }
  }

  /**
   * Find the phrase in the database that best matches searchText
   * @param searchText is the text to match
   * @param userData is a UserData object which contains history and phraseFrequency etc...
   *
   * @return wcDB is the document that best matches searchText
   * @return wcUser is searchText tokenized based on whitespace
   * @return matchScore is the scoring for each word, -3 unmatched stopword
   * 			-1 means unmatched word, -2 means unmatched word immediately
   * 			following another unmatched word
   * @return match is the elasticsearch document, represents the phrase in the
   * 			phrase database.
   * @return returns the list of matched words with associated indexes given
   * in 'bestMatch' and returns unmatched words with the index given as -1.
   */
  find(searchText, userData) {
    debug("Stepping into phrasex find", searchText);
    Helper.logAndThrowUndefined("Phrasex search text is undefined", searchText);

    Logger.info("searching for text", searchText);

    debug("database", this.database);

    let query = {
      index: this.database,
      size: this.gf.elasticsearch.numResultsPhrase,
      searchType: "dfs_query_then_fetch",
      body: {
        explain: false,
        highlight: {
          fields: {
            words: {
              force_source: true
            }
          },
          require_field_match: true
        },
        query: {
          multi_match: {
            fields: ["words"],
            query: searchText,
            fuzziness: "AUTO"
          }
        }
      }
    };

    let p = this.client.search(query);

    //let np = new Promise((resolve, reject) => {
    let np = p
      .then(body => {
        if (body.hits.total == 0) {
          Logger.warn("No match for query", searchText);
          return Promise.reject([{ confidence: 0.0 }]);
          //return;
        }

        //Logger.error('Hits',body.hits.hits);
        let hits = this.hitsFilter.filter(body.hits.hits);

        //get the phrase from elastic search with the closest match and tokenize
        let hitList = reRank(hits, searchText, userData.phraseFrequency);
        let orderedList = this.filterResults(hitList);

        debug("hitList", hitList);
        debug("orderedList", orderedList);

        if (!orderedList.length) {
          Logger.warn("No hits match", searchText);
          return Promise.reject([{ confidence: 0.0 }]);
        }

        let pList = [];
        for (let i = 0; i < orderedList.length; i++) {
          let hit = orderedList[i].result;

          debug("hit", hit);

          let source = hit._source;
          let highlight = hit.highlight;

          Logger.debug("Source", body.hits);
          let bestMatch = source["phrase"].match(Helper.tokenize);

          //tokenize the query
          let query = searchText.match(Helper.tokenize);

          //We already know the score so we don't need to call alignWords
          let align = slotFiller.computeQueryIndex(
            orderedList[i].score,
            bestMatch,
            query
          );

          let queryIndex = align.queryIndex;

          //Runs through the words and check for stopwords if the index is
          //already -1.  Stopwords will be -3.
          //Also, make sure at least one value matched, i.e., index>=0

          let numMatched = 0;
          for (let i = 0; i < queryIndex.length; i++) {
            if (queryIndex[i].index == -1) {
              let simpleWord = queryIndex[i].word
                .replace(Helper.nonAlphaNumeric, "")
                .toLowerCase();
              let isStop = Helper.isStopWord(simpleWord);
              if (isStop) {
                //Mark as a stopword
                queryIndex[i].index = -3;
              }
            }

            if (queryIndex[i].index >= 0) {
              numMatched = numMatched + 1;
            }
          }

          let wordsInPhrase = searchText.match(Helper.tokenize).length;

          let score = align.score * align.order * align.size;

          debug("queryIndex", queryIndex);

          if (numMatched) {
            let ans = {
              wcDB: bestMatch,
              wcUser: query,
              matchScore: queryIndex,
              source: source,
              highlight: highlight.words,
              confidence: score,
              score: align
            };

            //console.log('Phrasex Response', ans)
            //return Promise.resolve(ans);
            debug("adding to plist", ans);
            pList.push(ans);
            //return Promise.resolve([ans])
          } else {
            Logger.warn("Wasn't able to match a single word");
            //pList.push({confidence : 0.0})
            //return Promise.reject({ confidence: 0.0 });
          }
        }

        //debug('PLIST', pList)
        if (pList.length) {
          return Promise.resolve(pList);
        }

        return Promise.reject([{ confidence: 0.0 }]);
      })
      .catch(reason => {
        Logger.error(reason);
        return Promise.reject([{ confidence: 0.0 }]);
      });
    //});

    return np;
  }

  /**
   * Get the wildcards for a given phrase
   * @param phrase is the phrase passed in, example "Where are the the hash browns".
   * @param keywords are special words to help differentiate neighboring
   * wildcards where one wildcard is a keyword
   * @param userData is a UserData object for storing information (including statistics and history)
   * for a given user.
   * @return the promise containing the source and the wildcards.
   */
  getWildcardsAndMatch(phrase, keywords, userData) {
    debug("getWildcardsAndMatch");
    if (!phrase) {
      return Promise.resolve();
    }

    let p = this.find(phrase, userData);
    Logger.debug("searching phrase", phrase);

    let np = p
      .then(resArrayList => {
        return Promise.resolve(
          this.getWildcardsAndMatchNoSearch(resArrayList, keywords, userData)
        );
      })
      .catch(reason => {
        Logger.warn(reason);
        return Promise.reject(reason);
      });

    return np;
  }

  /**
   * Get the wildcards for a given phrase
   * @param resArrayList is a list of matching phrases.
   * @param keywords are special words to help differentiate neighboring
   * wildcards where one wildcard is a keyword
   * @param userData is a UserData object for storing information (including statistics and history)
   * for a given user.
   * @return the promise containing the source and the wildcards.
   */
  getWildcardsAndMatchNoSearch(resArrayList, keywords, userData) {
    //For now deal with the first result
    let pList = [];
    for (let i = 0; i < resArrayList.length; i++) {
      let resArray = resArrayList[i];

      Logger.debug(resArray);
      let bestMatch = resArray.wcDB;
      let query = resArray.wcUser;
      let queryIndex = resArray.matchScore;
      let source = resArray.source;
      let score = resArray.confidence;

      //console.log("bestmatch",bestMatch)
      let wcAndScore = slotFiller.computeWildcards(
        bestMatch,
        query,
        queryIndex,
        keywords
      );

      //console.log('source', source, 'wildcards', wildcards, resArray)
      pList.push({
        source: source,
        wildcards: wcAndScore.wildcards,
        confidence: score,
        wcScore: wcAndScore.score,
        score: resArray.score
      });
    }

    return pList;
  }
}

module.exports = Phrasex;
