"use strict";
let Helper = require("sb/etc/Helper.js");
let debug = require("debug")("ReRank");
let ld = require("damerau-levenshtein");
let Logger = require("sb/etc/Logger.js")("ReRank");

let similarity = require("sb/phrasex/SentenceSimilarity.js");
let similarityScore = require("sb/phrasex/SimilarityScore.js");
let deepcopy = require("clone");

//Compare the complete score
function compare(a, b) {
  let scoreA = a.score.score * a.score.order * a.score.size;
  let scoreB = b.score.score * b.score.order * b.score.size;

  //debug('score', scoreA, scoreB)

  if (scoreA < scoreB) {
    return 1;
  } else if (scoreA > scoreB) {
    return -1;
  }
  return 0;
}

//Compare the matchScore only
function compareScore(a, b) {
  let scoreA = a.score.score;
  let scoreB = b.score.score;

  //debug('score', scoreA, scoreB)

  if (scoreA < scoreB) {
    return 1;
  } else if (scoreA > scoreB) {
    return -1;
  }
  return 0;
}

//Compare the matchScore only
function compareExactScore(a, b) {
  let scoreA = a.score.exact;
  let scoreB = b.score.exact;

  //debug('score', scoreA, scoreB)

  if (scoreA < scoreB) {
    return 1;
  } else if (scoreA > scoreB) {
    return -1;
  }
  return 0;
}

/**
 * Search through the elasticsearch results and look for all of
 * the results that have boostRank defined.  Move these search
 * results to the head of the results list.
 */
let boostSort = function(esResult) {
  let boostSet = [];
  let normalSet = [];
  for (let i = 0; i < esResult.length; i++) {
    if (esResult[i]._source.boostRank) {
      debug("Adding to boostSet");
      boostSet.push(esResult[i]);
    } else {
      debug("Adding to normalSet");
      normalSet.push(esResult[i]);
    }
  }

  return boostSet.concat(normalSet);
};

//Take an elasticsearch input and resort based on some measure
let reSort = function(esResult) {
  return esResult.sort(compareScore);
};

/**
 *
 */
let alignmentRank = function(rSet, searchText) {
  //Otherwise we need to compare!
  let searchArray = searchText.match(Helper.tokenize);

  let score = [];
  let ansList = [];

  let phraseOld = null;
  let scoreOld = null;
  for (let i = 0; i < rSet.length; i++) {
    let phrase = rSet[i]._source.phrase;

    if (phrase == phraseOld) {
      //There can be 1000's of identical phrases so don't re-calculate the score in this case
      let ans = scoreOld;
      ansList.push({
        result: rSet[i],
        confidence: ans.score * ans.order * ans.size,
        score: deepcopy(ans)
      });
    } else {
      let wordArray = rSet[i]._source.phrase.match(Helper.tokenize);
      //let ans = similarity(searchArray, wordArray, { f: similarityScore.metaphoneDl, options: { threshold: 0.3 } })
      let ans = similarity(searchArray, wordArray, similarityScore.commonScore);
      //debug('ans', ans)

      ansList.push({
        result: rSet[i],
        confidence: ans.score * ans.order * ans.size,
        score: ans
      });

      scoreOld = ans;
      phraseOld = phrase;
    }
    //ansList.push({ result: rSet[i], confidence: ans.score })
  }

  return ansList;
};

/**
 * Rank top results by frequency of occurence.  If wildcards are missing
 * then they need to be recovered from previous statements.
 */
let frequencyRank = function(rSet, phraseFrequency) {
  //Now if there is more than one, how do we differentiate?
  //Absolute probability
  let pSum = 0.0;
  let ansList = [];
  for (let i = 0; i < rSet.length; i++) {
    let gId = rSet[i]._source.meta.groupIndex;
    let tp = phraseFrequency.getProbability(gId);
    ansList.push({ result: rSet[i], confidence: tp });
  }

  return ansList;
};

let combineRank = function(hits, searchText, phraseFrequency) {
  let ans1 = alignmentRank(hits, searchText);
  let ans2 = frequencyRank(hits, phraseFrequency);

  //Get the top alignment ranking...
  /*let bestAns = Helper.objectWithBestValue(ans1, (a, b) => {
        return b.confidence > a.confidence
    })*/

  /*for(let i=0; i<ans1.length; i++) {
        debug('Alignment rank', ans1[i])
         Logger.debug('ans',ans1[i])
    }*/
  //debug('Alignment rank', ans1)
  //debug('Frequency Rank', ans2)

  let newAns = [];
  for (let i = 0; i < hits.length; i++) {
    //let newConf = ans1[i].confidence;
    //if (ans1[i].confidence == bestAns.confidence) {
    let newConf = ans1[i].confidence + ans2[i].confidence;
    //}

    debug("newConf", newConf);
    newAns.push({ result: hits[i], confidence: newConf, score: ans1[i].score });
  }

  return newAns;
};

/**
 * After you use elasticsearch (or something else) to return
 * a rough estimate of the best score, run through ReRank to
 * produce the final ranking.
 *
 * First find the best exact score and accept all scores
 * where the exact score or partial score is better than
 * the best exact score.
 *
 * After that, filter based on the best overall score,
 * score*order*length.  If anything remains with the identical
 * score, then choose the one that is not a "tell" as sometimes
 * tells are identical to phrases.  Case in point is
 * "My name is john" can be both a greeting and a response - however,
 * we generally search on phrases and simply respond with response, there
 * is no search involved in the response.
 */
let reRank = function(hits, searchText, phraseFrequency) {
  //let rSet = Helper.topScores(hits);
  let rSet = hits;

  let newAns = combineRank(rSet, searchText, phraseFrequency);

  //Then based on the exact score
  newAns.sort(compareExactScore);
  debug(newAns);
  let bestScore = newAns[0].score.exact;
  let bestList = [];
  if (bestScore > 0) {
    for (let i = 0; i < newAns.length; i++) {
      if (newAns[i].score.exact == bestScore) {
        bestList.push(newAns[i]);
      } else {
        break;
      }
    }
  }

  //First, just score based on the number of matches partial matches
  newAns.sort(compareScore);
  let otherScore = newAns[0].score.score;
  if (bestScore == 0) bestScore = otherScore;
  //bestScore = bestScore ? bestScore : otherScore

  //Select results with the same number of matches

  for (let i = 0; i < newAns.length; i++) {
    if (newAns[i].score.score >= bestScore) {
      bestList.push(newAns[i]);
    } else {
      break;
    }
  }

  //debug('bestList', bestList)

  //Then use order an length normalization to disambiguate
  let bestAns = Helper.objectWithBestValue(bestList, (a, b) => {
    //What if two objects have the same score?
    //return a.score.order < b.score.order
    return (
      a.score.score * a.score.order * a.score.size <
      b.score.score * b.score.order * b.score.size
    );
    //return a.score.score < b.score.score
  });

  let bs = bestAns.score.score * bestAns.score.order * bestAns.score.size;
  debug("bestAns", bestAns, "bs", bs);

  //Create an array where the scores are the highest and identical
  let equalList = [];
  for (let i = 0; i < bestList.length; i++) {
    let score = bestList[i].score;
    let a = score.score * score.order * score.size;
    debug("bestList", bestList[i]);
    debug("a", a, "bs", bs);
    if (a >= bs) {
      equalList.push(bestList[i]);
    }
  }

  if (equalList.length) {
    return equalList;
  }

  return null;
};

module.exports.combineRank = combineRank;
module.exports.reRank = reRank;
module.exports.alignmentRank = alignmentRank;
module.exports.frequencyRank = frequencyRank;
module.exports.reSort = reSort;
module.exports.boostSort = boostSort;
