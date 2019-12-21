'use strict'
let Logger = require('helper-clockmaker').Logger('PhrasexBot')
let { Helper } = require('helper-clockmaker')

let SingleResponseIfc = require('./SingleResponseIfc').SingleResponseIfc
let { Phrasex, BasicPhrasexDatabase } = require('neural-phrasex')
let slotFiller = require('slot-filler')

let PhraseHitsFilterFactory = require('neural-phrasex').PhraseHitsFilter
let debug = require('debug')('BasicBot')

let { GenerateObject } = require('neural-phrasex')

let deepcopy = require('lodash.clonedeep')///*require("deepcopy")*/ require('clone')
//let deepcopy = require('deepcopy')

/**
 * This bot uses Phrasex along with the phrase database
 * to determine question responses.  There is no database installed
 * such as a database of food types, rows and aisles, instead
 * there is only a phrase database so that the bot recognizes
 * phrases and can respond accordingly.
 */
class BasicBot extends SingleResponseIfc {
  constructor(botEngine) {
    super()
    //this.search = new Es(); <--- defined in derived class
    this.pdb = null; //new PhraseDatabase()
    this.tellMap = new Map()

    this.botEngine = botEngine
    Helper.logAndThrowUndefined("You must define the botEngine in the BasicBot constructor", this.botEngine)

    //Set this flag to false if you want to turn of statistics as would
    //be the case in some tests.
    this.statisticsFlag = true

    //Storage is used for storing additional information the bot knows.
    this.storage = new GenerateObject()
    this.countEntry = 0
  }

  /**
   * Initialize the phrase table
   * @param confShallow is the configuration.  I'm not sure everything that is included in
   * this, but it can be used to specify the phrase table used by the bot, so for example
   * {phraseTable : 'tablename'}
   */
  async initialize(confShallow) {
    let conf = deepcopy(confShallow)

    this.pdb = BasicPhrasexDatabase.generatePhraseDatabase(conf.database)
    this.phrasex = new Phrasex(this.pdb)
    let res = await this.phrasex.initialize()

    this.tellMap = await this.pdb.getPhraseMap('tell')
    debug('this.tellMap', this.tellMap)

    if (conf.hitFilter) {
      this.phrasex.setHitsFilter(PhraseHitsFilterFactory(conf.hitFilter))
    }

  }

  /**
   * This function is used to store data from the on the fly database.  If the
   * user says john is in the store, this function records the required information
   * so that it can be retrieved later.
   */
  storeData(storage, wildcards, userData, intent, source, botStorage) {
    if (!storage.set) return

    for (let i in storage.set) {
      let ia = i.replace(':', '.').split('.')
      if (ia[0] == 'other') {
        //store something about the bot, might
        //might want to disable this.
        //userData.storage.insertElement(wildcards, i, storage[i])
        botStorage.insertElement(wildcards, i, storage.set[i], intent, source)
      } else if (ia[0] == 'self') {
        userData.storage.insertElement(
          wildcards,
          i,
          storage.set[i],
          intent,
          source
        )
      } else {
        userData.storage.insertElement(
          wildcards,
          i,
          storage.set[i],
          intent,
          source
        )
        botStorage.insertElement(wildcards, i, storage.set[i], intent, source)
      }
    }
    debug('We have storage', userData.storage.getObj())
  }

  /**
   * Retreive data from the database generated on the fly by conversation
   * with the user.  This is basically will allow you to say "John is in the store"
   * and then for the bot to respond correctly when you say "Where is john"
   */
  retrieveData(storage, wildcards, userData, intent, botStorage) {
    debug('wildcards before retrievData', wildcards, 'intent', intent)

    if (!storage.get) return

    let info = null

    //You can also fill in the values
    for (let i in storage.get) {
      let elem = storage.get[i]
      let p = elem.match(Helper.betweenParentheses)
      if (p) elem = p[1]

      let pathObj = userData.storage.expandElement(wildcards, i)
      let path = pathObj.val

      let completeArray = userData.storage.completeArray(path, intent)
      if (!completeArray) continue

      debug('storage', storage, 'path', path, 'i', i)

      //let ia = i.replace(':', '.').split('.')
      if (path[0] == 'other') {
        //store something about the bot, might
        //might want to disable this.
        //let val = userData.storage.getElement(path)
        //debug('----------------------path',path)
        debug('before flatten')
        let val = botStorage.flattenedObject(
          i,
          elem,
          completeArray.val,
          wildcards
        )
        info = botStorage.getAll(path, intent)

        debug('flattenedObject', val, wildcards)
        //let val = this.storage.getElement(path, intent)
        if (val) {
          wildcards.usedStorage = true
        }
      } else if (path[0] == 'self') {
        let val = userData.storage.flattenedObject(
          i,
          elem,
          completeArray.val,
          wildcards
        )
        info = userData.storage.getAll(path, intent)

        //let val = userData.storage.getElement(path, intent)
        debug('val', val)
        if (val) {
          wildcards.usedStorage = true
        }
      } else {
        debug('path', path, 'intent', intent)
        debug('userData.storage', userData.storage.getObj())
        debug('i', i, 'elem', elem, 'path', completeArray)
        //let val = userData.storage.getElement(path, intent)
        let val = userData.storage.flattenedObject(
          i,
          elem,
          completeArray.val,
          wildcards
        )
        info = userData.storage.getAll(path, intent)

        debug('val', val, 'info', info)
        if (val) {
          wildcards.usedStorage = true
        }
      }
    }

    debug('wildcards after retrieveData', wildcards)
    return info
  }

  /**
   * Take in a question and then compute the response.
   * TODO: break this piece of code up a bit more.
   * @param resArray is an array of search results with attached scores.
   */
  async processResult(
    resArray,
    originalUserData,
    botStorage,
    ignoreWildcardHistory,
    scoreBasedOnSearch
  ) {
    try {
      this.countEntry++
      debug('countEntry', this.countEntry)

      let pList = []
      let uList = []
      let bList = []
      let wList = []
      let infoList = []
      for (let i = 0; i < resArray.length; i++) {
        //Ok, this copies the entire user data, a costly operation.
        //One should just copy the history and database when the time comes.

        //debug('originalUserData', originalUserData)
        //debug('botStorage', botStorage)
        let userData = deepcopy(originalUserData)
        //debug('userData aagin', userData)

        let lStorage = deepcopy(botStorage)

        //let userData = userDataList[i];

        let res = resArray[i]
        //debug('RES', res)

        let source = res.source
        let wildcards = res.wildcards
        let confidence = res.confidence
        let storage = res.source.storage

        let typeIdentifier = this.pdb.getTypeIdentifier(source)
        let replies = this.tellMap.get(typeIdentifier)
        debug('replies', replies)
        debug('typeIdentifier', typeIdentifier)


        //Store data and fill in from local storage
        //These can override information in the database
        //This could also put in bogus data, but can also put in multiple
        //copies of correct data!  Could cause some strange results so watch out!
        debug(
          '------------------------storage-------------------',
          storage,
          source.implies[0]
        )
        let info = null
        if (storage) {
          this.storeData(
            storage,
            wildcards,
            userData,
            source.implies[0],
            source,
            lStorage
          )

          //You can also fill in the values
          info = this.retrieveData(
            storage,
            wildcards,
            userData,
            source.implies[0],
            source,
            lStorage
          )
        }

        infoList.push(info)

        //Lets fill in wildcards ahead of time with guesses
        //debug('wildcards',wildcards)
        debug('userData', userData)
        debug(
          'wildcards',
          wildcards,
          'history',
          userData.history,
          'lastHistory',
          userData.getLastHistory()
        )
        if (!ignoreWildcardHistory) {
          //You ignore the history if your have expanded a word, in general
          for (let i in wildcards) {
            debug('i', i)
            if (!wildcards[i] && i != 'matched') {
              debug('replacing', i, wildcards[i])
              let res = slotFiller.getWildcardFromHistory(i, userData.history, 5)
              //debug('res', res, userData.history)
              if (res.length) {
                wildcards[i] = res[0]
                debug('with', res[0])
              }
            }
          }
        }
        debug('wildcards after insertion', wildcards)

        res.wildcards = wildcards
        userData.unshiftHistory(res)

        //Actually compute the result
        debug('this.botEngine', this.botEngine)
        let firstGuess = await this.botEngine.computeResult(
          {
            typeIdentifier: typeIdentifier,
            replies: replies,
            wildcards: wildcards,
            source: source,
            doc: this.doc,
            confidence: confidence,
            score: res.score,
          },
          userData,
          scoreBasedOnSearch
        )
        debug('firstGuess', firstGuess)

        //All promises must resolve, which I believe they do (rejections caught and turned to resolve)
        pList.push(firstGuess)
        uList.push(userData)
        bList.push(lStorage)
        wList.push(res.wcScore)
      }

      debug('ans.length', pList.length)
      let newVal = []
      for (let i = 0; i < pList.length; i++) {
        pList[i].wcScore = wList[i]
        newVal.push({ val: pList[i], userData: uList[i], storage: bList[i] })
      }

      debug('--------------------------NEWVAL-------------------', newVal)

      //There are many results given in the list, pick the best.
      let final = this.trimResults(newVal, infoList)

      debug('final', final)
          
      //copy the two critical components
      originalUserData.shallowCopy(final.userData)
      //debug('originalUserData', originalUserData)

      debug(
        'FINAL STORAGE-------------------------',
        originalUserData.storage,
        final.storage
      )
      debug('botStorage', botStorage)
      for (let i in final.storage) {
        botStorage[i] = final.storage[i]
      }
      //debug('just before final promise.',final)
      debug('finalHistory', final.userData.history)
      return final.val
    } catch (error) {
      debug('Error', JSON.stringify(error, null, 2))

    }
  }

  /**
   * At this point we may still have dozens of responses and we need to decide which
   * responses are the best.  We do this through a number of procedures including
   * looking at the score of the original question, the wildcard score...
   */
  trimResults(ansObj, infoList) {
    let ans = []
    let uList = []
    let bList = []
    for (let i = 0; i < ansObj.length; i++) {
      ans.push(ansObj[i].val)
      uList.push(ansObj[i].userData)
      bList.push(ansObj[i].storage)
    }

    //debug("ULIST",uList)

    if (ans.length == 1) {
      return { val: ans[0], userData: uList[0], storage: bList[0] }
    }

    //First check the result and see if any have the
    //identical group for the original statement, return that
    //Now lets get the best score of these results.

    for (let i = 0; i < ans.length; i++) {
      debug('--------------------ans---------------------', ans[i])

      //If a response matches the original statement, use that since if the grammar
      //is wrong it's because the user has bad grammar.
      if (infoList[i]) {
        //debug('infoList[i]', infoList[i])
        //debug('ans[i]', ans[i])

        let g1 = Helper.getTypeIdentifier(infoList[i].info)
        let g2 = Helper.getTypeIdentifier(ans[i].phrase)

        debug('g1', g1, 'g2', g2)
        if (g1 == g2) {
          debug(
            '------------------- LEAVING because g1=g2 -----------------------------'
          )
          return { val: ans[i], userData: uList[i], storage: bList[i] }
        }
      }
    }

    //If we haven't returned, find the top score of the remaining objects.  In many
    //cases the confidence may have been set to zero so not all scores are the same.
    let highScore = 0.0
    let found = false
    for (let i = 0; i < ans.length; i++) {
      if (ans[i].confidence > highScore && ans[i].success) {
        highScore = ans[i].confidence
        found = true
      }
    }

    if (!found) {
      return { val: ans[0], userData: uList[0], storage: bList[0] }
    }

    debug('highScore', highScore)

    let newList = []
    let newUserData = []
    let newStorage = []
    //Now filter out all
    for (let j = 0; j < ans.length; j++) {
      if (ans[j].confidence == highScore && ans[j].success) {
        newList.push(ans[j])
        newUserData.push(uList[j])
        newStorage.push(bList[j])
      }
    }

    if (newList.length == 1) {
      return {
        val: newList[0],
        userData: newUserData[0],
        storage: newStorage[0],
      }
    }
    //debug('ans',ans)
    debug('newList', newList)

    //Now compute the best slotScore
    let highestSlotScore = 0
    for (let i = 0; i < newList.length; i++) {
      newList[i].slotScore = newList[i].slotScore ? newList[i].slotScore : 0
      if (newList[i].slotScore > highestSlotScore) {
        highestSlotScore = newList[i].slotScore
      }
    }

    let bestSlotList = []
    let bestSlotUserData = []
    let bestSlotStorage = []
    for (let i = 0; i < newList.length; i++) {
      if (newList[i].slotScore == highestSlotScore) {
        bestSlotList.push(newList[i])
        bestSlotUserData.push(newUserData[i])
        bestSlotStorage.push(newStorage[i])
      }
    }

    if (bestSlotList.length == 1) {
      return {
        val: bestSlotList[0],
        userData: bestSlotUserData[0],
        storage: bestSlotStorage[0],
      }
    }

    //Ok, if we still have multiple results, then reduce further by the question slot score!
    //This can happen if the response did not use all the information from the input slots,
    //such as when somebody is saying "teddy is in the store" which has 2 slots and the response
    //is just "uh huh" which does not use any of that slot data.

    let highestWcScore = 0
    for (let i = 0; i < bestSlotList.length; i++) {
      let wcScore = 0
      if (bestSlotList[i].wcScore) {
        wcScore = bestSlotList[i].wcScore.score
          ? bestSlotList[i].wcScore.score
          : 0
      }
      bestSlotList[i].tScore = wcScore

      if (wcScore > highestWcScore) {
        highestWcScore = wcScore
      }
    }

    let final = []
    let finalUserData = []
    let finalStorage = []
    for (let i = 0; i < bestSlotList.length; i++) {
      if (bestSlotList[i].tScore == highestWcScore) {
        final.push(bestSlotList[i])
        finalUserData.push(bestSlotUserData[i])
        finalStorage.push(bestSlotStorage[i])
      }
    }

    //At this point I could choose a random element, but just choose 0!
    return {
      val: final[0],
      userData: finalUserData[0],
      storage: finalStorage[0],
    }
  }

  /**
   * Try and compute a response given the phrase, userData and
   * where things should be explicit or not.
   * @param phrase is the actual phrase of interest
   * @param userData is the UserData structure for the particular history
   * stores a recent history of questions and answers (among other things)
   * for the user.
   * @param explicit tells the bot whether we can search the database
   * for a single word such as 'bread' or if we require a phrase match first
   * such as "where is the bread".  If explicit=true then a phrase match
   * is required.
   */
  async standardResult(phrase, userData, explicit) {
    debug('Stepped in tryResult with phrase', phrase)

    //Empty or whitespace check
    if (!phrase.match(Helper.tokenize)) {
      //They just hit enter by accident.
      return Promise.resolve({ response: '', success: true, confidence: 1.0 })
    }

    let newRes = await this.phrasex.getWildcardsAndMatch(phrase, this.keywords, userData)

    try {
      let ans = await this.processResult(newRes, userData, this.storage, false)
      return ans
    } catch (error) {
      return Helper.failResponse
    }
  }

  /**
   * Process a complete phrase "Where is the tuna"
   * @param phrase is the phrase to generate a response
   * to.
   */
  respondToPhrase(phrase, userData, botStorage) {
    return this.processResult(phrase, userData, botStorage)
  }

  /**
   * Get the result of the question, of course
   * @param phrase is the phrase to work on
   * @param userData is a UserData object
   * @param forget tells whether or not the computed object
   * should be stored in the phraseFequency object.  If the value
   * is false, or undefined then data is stored.  If it's true
   * it's not stored.
   *
   * TODO: forget is no longer needed if we simply do a deepcopy of userData
   * which is what I am now doing.  This is more expensive, but much cleaner.
   *
   * @param explicit is set to true if we do not want the bot
   * to expand if no phrase match is found - i.e. (use default search).  This is important
   * if multiple bots are listening and we only want to respond to
   * explicit answers.
   */
  async getResult(phrase, userData, forget, explicit) {
    debug('Stepped into getResult with phrase', phrase)

    try {

      //debug('userData before standard result++++++++++++++', userData)
      let res = await this.standardResult(phrase, userData, explicit)
      //debug('userData after standard result---------------', userData)

      debug('returning from standard result')
      //debug("Before PhraseFrequencyData")
      //Not totally sure why res.phrase would ever be undefined, but it is apparently.

      //causes untold problems
      /*if (this.statisticsFlag && res.phrase && !forget) {
              //debug('Adding PhraseFrequency Data')
              userData.phraseFrequency.addPhrase(res.phrase, res.confidence)
  
              debug('PhraseFrequency', userData.phraseFrequency)
          }*/

      //This generally means somebody is telling you some information
      if (res.dontRespond) {
        //Don't modify things further'
        return Promise.resolve(res)
      }

      debug('Add phrase', res)

      //If the confidence is low, just give it a failing grade
      //res.confidence = res.confidence ? res.confidence : 0.0;
      /*if (res.confidence < 0.2) {
              res.confidence = 0.0;
              res.success = false;
          }*/

      if (Helper.isFailResponse(res)) {
        res.response = Helper.selectRandom(Helper.defaultResponse)
      } else if (res.response == '') {
        //Reaches this point if '' was entered as the phrase (pressed enter)
        res.response = Helper.selectRandom(Helper.defaultResponse)
      }
      debug('Returning a good result', res)
      return res

    } catch (reason) {
      debug('Returning a bad result', reason)
      Logger.error(reason)
      let res = Helper.failResponse
      res.confidence = 0.0
      res.response = Helper.selectRandom(Helper.defaultResponse)
      return res
    }

  }
}

module.exports = BasicBot
