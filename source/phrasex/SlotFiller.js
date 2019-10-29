'use strict'

let Logger = require('sb/etc/Logger.js')('SlotFiller')
let es = require('elasticsearch')
let levenshtein = require('fast-levenshtein')
let Helper = require('sb/etc/Helper.js')
let reRank = require('sb/phrasex/ReRank.js').reRank
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let PhraseMatcher = require('sb/phrasex/PhraseMatcher.js')
let PhraseHitsFilterFactory = require('sb/phrasex/PhraseHitsFilter.js')
let similarity = require('sb/phrasex/SentenceSimilarity.js')
let similarityScore = require('sb/phrasex/SimilarityScore.js')
let deepcopy = require('clone')
let debug = require('debug')('SlotFiller')

/**
 * A bunch of functions for filling in slots in a phrase suchs as
 * what was his (name) where (name) is the slot.
 */
module.exports = {
  computeQueryIndex(v, bestMatch, query) {
    let res = []
    for (let i = 0; i < v.matched.length; i++) {
      let word
      if (v.matched[i] == -1) {
        word = query[i]
      } else {
        word = bestMatch[v.matched[i]]
      }
      res.push({ index: v.matched[i], word: word })
    }

    for (let i = 0; i < v.matched.length; i++) {
      if (v.matched[i] != -1) {
        delete bestMatch[v.matched[i]]
        delete query[i]
      }
    }

    debug(query, bestMatch)
    return { queryIndex: res, score: v.score, order: v.order, size: v.size }
  },

  alignWords(bestMatch, query) {
    let v = similarity(query, bestMatch, similarityScore.commonScore)
    debug(v)
    return this.computeQueryIndex(v, bestMatch, query)
  },

  /**
   * Just see if a word can be found in a list of word.
   * Right now this does exact matching though we will want
   * fuzzy matching at some point.
   * @param word to match
   * @param list is the array of words to compare with
   * @return the index of list that corresponds to the match
   * otherwise return -1.
   */
  getMatchIndex(word, list) {
    if (!list || !word) return -1

    //clean the word

    //console.log('cleanWord',cleanWord,word)
    for (let i = 0; i < list.length; i++) {
      let id = list[i].indexOf(word)
      if (id != -1) return i
    }

    return -1
  },

  /**
   * I'm not sure how to differentiate two wildcards that are side by side so
   * This case solves the problem where wildcards are separated by a word or there
   * is a single wild card.
   * @param queryIndex
   * @param keywords are a list of words that can be used to differentiate
   * neighboring wildcards.  "Where is (name) (thing)" where name = john and
   * thing = email cannot be differentiated unless we know that 'email' is
   * a keyword.  Right now we need exact match, but may use fuzzy match in
   * the future.
   **/
  computeSeparateWildcards(queryIndex, keywords) {
    //shrink phrase
    for (let i = 0; i < queryIndex.length; i++) {
      //Get the unmatched word
      if (queryIndex[i].index == -1) {
        //Check the next n words and see if they are unmatched
        for (let j = i + 1; j < queryIndex.length; j++) {
          if (queryIndex[j].word) {
            queryIndex[j].word = queryIndex[j].word.replace(
              Helper.nonAlphaNumeric,
              ''
            )
          }
          //debug('queryIndex[j].word',queryIndex[j].word)
          let keywordIndex = this.getMatchIndex(
            queryIndex[j].word.toLowerCase(),
            keywords
          )
          //let keywordIndex = -1;
          //console.log("keywordIndex",keywordIndex)
          if (keywordIndex == -1) {
            //It's not a keyword so group it.
            //If the next word is unmatched, it's really two words 'tuna salad'
            if (queryIndex[j].index == -1) {
              queryIndex[i].word = queryIndex[i].word + ' ' + queryIndex[j].word
              queryIndex[j].index = -2
            } else {
              //otherwise it's just one word 'tuna'
              break
            }
          } else {
            break
          }
        }
      }
    }

    //create the simpler index
    let reducedIndex = []
    for (let i = 0; i < queryIndex.length; i++) {
      if (queryIndex[i].index > -2) {
        reducedIndex.push(queryIndex[i])
      }
    }

    //console.log(reducedIndex)

    return reducedIndex
  },

  /**
   * If 2 wildcards neighbor each other, make an educated guess about
   * how they should be split up.  This won't solve all problems, but
   * may work for a large number of cases.
   * @param wildCardIndex
   * @param reducedIndex
   */
  fixForNeighboringWildcards(wildCardIndex, reducedIndex) {
    debug('wcIndex', wildCardIndex, 'reducedIndex', reducedIndex)

    let reducedWc = []
    for (let i = 0; i < reducedIndex.length; i++) {
      if (reducedIndex[i].index == -1) {
        reducedWc.push(i)
      }
    }

    //Can't do any better than this so return
    if (reducedWc.length >= wildCardIndex.length) return reducedIndex

    debug('Need more wildcards!')
    //otherwise, we need to do some more guessing
    let newReducedIndex = deepcopy(reducedIndex)

    //They need more wildcards than are available so might try and split some up!
    //We split them based on order, so, ...
    let iReduced = 0
    let iOffset = 0
    for (let i = 0; i < wildCardIndex.length - 1; i++) {
      debug(
        'inside loop',
        i,
        wildCardIndex[i].index,
        wildCardIndex[i + 1].index
      )
      //if the wildcards are neighbors then split the reducedIndex if possible
      if (wildCardIndex[i].index == wildCardIndex[i + 1].index - 1) {
        debug('The wildcards are neighbors!')
        let id = reducedWc[iReduced]
        let newWords = reducedIndex[id].word.split(' ')
        debug('id', id, 'newWords', newWords)

        if (newWords.length > 1) {
          //We'll guess that the first wildcard is the first word
          let firstWc = newWords[0]

          //We guess that the second wildcard is the rest of the words
          let lastWc = newWords.slice(1, newWords.length).join(' ')

          debug('firstwc', firstWc, 'lastWc', lastWc)

          newReducedIndex.splice(id + iOffset, 1, { index: -1, word: lastWc })
          newReducedIndex.splice(id + iOffset, 0, { index: -1, word: firstWc })
          iOffset++
        }
      }

      iReduced++
    }

    return newReducedIndex
  },

  /**
   * @param wildCardIndex is an array containing wildcard names and the index
   * of those values in the matched phrase.
   * @param reducedIndex is the index of the unkown words in the 'reduced' query.
   * The 'reduced query' combines word phrases like 'blue flower' into a single
   * index.
   * @param keywords are a list of words that can be used to differentiate
   * neighboring wildcards.  "Where is (name) (thing)" where name = john and
   * thing = email cannot be differentiated unless we know that 'email' is
   * a keyword.  Right now we need exact match, but may use fuzzy match in
   * the future.
   * @return the best matched wild card values in the form of 'name' : value
   * pairs as an object.
   */
  closestWildcardMatch(wildCardIndex, reducedIndex) {
    let wildcard = {}

    let indexes = []
    for (let i = 0; i < reducedIndex.length; i++) {
      if (reducedIndex[i].index == -1) {
        indexes.push(i)
      }
    }

    //Next, the number of unknowns in reducedIndex and
    //wildcard index may be different.  For example the
    //phrase "Ok, where is the tuna" will best match the
    //phrase "where is the (item)" but will have two unknowns
    // "ok" and "tuna".  We want to search for "tuna", but
    //ignore "ok" and we do this by choosing the index that
    //most closely matches the index of "tuna".  Obviously, this
    //approach will have problems in certain situations, but
    //is better than taking "ok".  Will improve as needed.
    let maxShift = indexes.length - wildCardIndex.length
    if (maxShift < 0) maxShift = 0

    //console.log('maxShift',maxShift)
    let bestShift = 0
    let bestDist = 1.0e6
    for (let i = 0; i < maxShift + 1; i++) {
      //compute the distance to each wild card
      let dist = 0
      for (let j = 0; j < wildCardIndex.length; j++) {
        let diff = wildCardIndex[j].index - indexes[j + i]
        dist += diff * diff
      }

      if (dist < bestDist) {
        bestShift = i
        bestDist = dist
      }
    }

    let minLength = Math.min(wildCardIndex.length, indexes.length)

    //Using the shift data
    wildcard.matched = true

    for (let i = 0; i < minLength; i++) {
      wildcard[wildCardIndex[i].wcIndex] =
        reducedIndex[indexes[i + bestShift]].word
    }

    //Add in the unmatched wildcards since these might be filled by historical data.  Set them
    //To null for now.
    let totalCount = 0
    let missCount = 0
    for (let i = 0; i < wildCardIndex.length; i++) {
      totalCount++
      if (!wildcard[wildCardIndex[i].wcIndex]) {
        wildcard[wildCardIndex[i].wcIndex] = null
        missCount++
      }
    }

    let wcScore = 1.0
    if (totalCount > 0) wcScore = (totalCount - missCount) / totalCount

    return {
      wildcards: wildcard,
      score: { score: wcScore, count: totalCount - missCount },
    }
  },

  /**
   * Given the best match phrase (bestMatch) return the computed wildcard values
   * @param bestMatch is the best matching phrase
   * @param query is the actual query passed to the bot
   * @param queryIndex is the index of the match of each word in query with
   * each word in bestMatch.  Words that are unmatched are likely wildcards
   * and are assigned the value -1.
   * @param keywords are special words to help differentiate neighboring
   * wildcards where one wildcard is a keyword
   * @return the list of wildcards as an object with wildcard name
   * and wildcard value {name : "john", item : "apple"}
   */
  computeWildcards(bestMatch, query, queryIndex, keywords) {
    //find the indexes of the wild cards and order
    let wildCardIndex = []

    for (let i = 0; i < bestMatch.length; i++) {
      if (bestMatch[i]) {
        let res = bestMatch[i].match(Helper.betweenParentheses)
        if (res) {
          wildCardIndex.push({ wcIndex: res[1], index: i })
        }
      }
    }

    let simpleIndex = this.computeSeparateWildcards(queryIndex, keywords)

    let fixedIndex = this.fixForNeighboringWildcards(wildCardIndex, simpleIndex)
    debug('fixedIndex', fixedIndex)
    let ans = this.closestWildcardMatch(wildCardIndex, fixedIndex)

    debug('wildcards and score', ans)
    return ans
  },

  getWildcardFromHistory(wildcardName, history, num) {
    let res = []
    let count = 0

    let a = history.toArray()
    let minLength = Math.min(num, a.length)

    for (let i = 0; i < minLength; i++) {
      if (a[i].wildcards[wildcardName]) {
        res.push(a[i].wildcards[wildcardName])
      }
    }

    return res
  },

  /**
   * Given a phrase including wildcards such as
   * "Where can (name) find the (item)" with wildcards
   * {name : "kaiper", item : "ball"} return the reconstructed
   * phrase "Where can kaiper find the ball"
   * @param phrase is the phrase including wildcards
   * @param wildcards is an object where each wildcard
   * is given a value.
   */
  reconstructPhrase(phrase, wildcards) {
    let tok = phrase.match(Helper.tokenize)

    //debug('tok',tok)
    let wcMatchCount = 0

    let ans = ''
    for (let i = 0; i < tok.length; i++) {
      let res = tok[i].match(Helper.betweenParentheses)
      //debug('res',res)
      //console.log('RES',tok[i],res)
      if (res) {
        tok[i] = wildcards[res[1]]
        //debug(res[1],wildcards[res[1]],tok[i])
        //debug('wildcard value',wildcards.ITEM, tok[i],res[1])
        if (!tok[i]) {
          return { phrase: '', success: false, score: 0 }
        } else {
          wcMatchCount++
        }
      }

      if (i == 0) {
        ans = ans + tok[i]
      } else {
        ans = ans + ' ' + tok[i]
      }
    }

    return { phrase: ans, success: true, score: wcMatchCount }
  },
}
