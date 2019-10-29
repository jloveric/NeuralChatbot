'use strict'
let Logger = require('sb/etc/Logger.js')('PhrasexBot')
let Helper = require('sb/etc/Helper.js')

let Es = require('./ElasticSearchQuery.js')
let BasicBot = require('./BasicBot')
let selectRandom = require('sb/etc/Helper.js').selectRandom
let Phrasex = require('sb/phrasex/Phrasex.js')
let slotFiller = require('sb/phrasex/SlotFiller.js')
let PhraseDatabase = require('sb/phrasex/PhraseDatabase.js')
let formatHelp = require('sb/etc/FormatHelp.js')

let PhraseHitsFilterFactory = require('sb/phrasex/PhraseHitsFilter.js')
let debug = require('debug')('PhrasexBot')
let findBest = require('sb/phrasex/ReRank.js').findBest
let PartsOfSpeech = require('sb/phrasex/PartsOfSpeech.js')
let GetDataConfig = require('sb/etc/GetDataConfig.js')

let deepcopy = require('clone')

/**
 * This is the main class in clockmaker, all other classes are called
 * through the PhrasexBot and BasicBot.  The PhrasexBot differs from
 * the BasicBot in that it also allows the user to attach and ask
 * questions about a relational database.
 */
class PhrasexBot extends BasicBot {
  constructor(botEngine) {
    super(botEngine)
    this.search = new Es()
    this.pos = new PartsOfSpeech()
  }

  close() {
    super.close()
    Helper.closeIfExists(this.search, 'search')
  }

  /**
   * Initialize the phrase table
   * @param confShallow is the configuration.  I'm not sure everything that is included in
   * this, but it can be used to specify the phrase table used by the bot, so for example
   * {phraseTable : 'tablename'}
   */
  initialize(confShallow) {
    let conf = deepcopy(confShallow)
    this.config = new GetDataConfig()
    let p0 = this.config.initialize(conf)

    let p1 = super.initialize(confShallow)
    //let conf = deepcopy(confShallow)

    let p2 = this.search.initialize(conf)

    //Array of all keywords that can be used to represent column names
    this.keywords = []
    this.columnReName = {}
    this.columnSynVector = {}
    this.columnMap = new Map()

    //class of the column
    this.columnType = new Map()

    //let np = new Promise((resolve, reject) => {
    let np = Promise.all([p0, p1, p2]).then(values => {
      //Ok, the mapping from the columnNames to renamed values which
      //are more representative
      this.columnReName = this.config.keywords

      debug('columnReName', this.columnReName)

      for (let i in this.config.databaseNameMapping) {
        this.columnType.set(this.config.databaseNameMapping[i], i)
      }
      Logger.debug('this.columnType', this.columnType)

      this.columnMap = this.config.synonyms

      if (!this.columnMap) {
        Logger.error('PhrasexBot columnMap is undefined')
        Helper.logAndThrow('PhrasexBot columnMap is undefined')
      }

      for (let data of this.columnMap) {
        let key = data[0]
        let value = data[1]

        this.keywords.push(data[0])

        if (this.columnSynVector[value]) {
          this.columnSynVector[value].push(key)
        } else {
          this.columnSynVector[value] = [key]
        }
      }

      console.log('syn', this.config.synonyms, 'cmap', this.columnMap)
      //process.exit(0);
      //TODO: should these be deepcopied ?
      this.botEngine.initialize({
        columnMap: this.columnMap,
        columnType: this.columnType,
        columnSynVector: this.columnSynVector,
        columnReName: this.columnReName,
        search: this.search,
        primary: this.config.primary,
      })

      return Promise.resolve(true)
    })
    //});

    return np
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
  standardResult(phrase, userData, explicit) {
    debug('Stepped in standardResult with phrase', phrase)

    //Then search the phrase database in case they are searching
    //for 'Do you have any cheese'.

    debug('Before new promise -- primary', this.config.primary)
    let np = new Promise((resolve, reject) => {
      if (!explicit) {
        //Empty or whitespace check
        if (!phrase.match(Helper.tokenize)) {
          //They just hit enter by accident.
          return resolve({ response: '', success: true, confidence: 1.0 })
        }

        //We don't want the user data to change unless we select he particular result.

        let pWordUserData = deepcopy(userData)
        let pFullUserData = deepcopy(userData)

        //Something better than complete copy will need to be figures out if these
        //local databases become large.
        let pWordStore = deepcopy(this.storage)
        let pFullStore = deepcopy(this.storage)

        let pWord = this.respondToWord(phrase, pWordUserData, pWordStore)
          .then(ans => {
            return Promise.resolve(ans)
          })
          .catch(error => {
            Logger.error(error)
            //debug('error pWord', error)
            return Promise.resolve(Helper.failResponse)
          })

        let pFull = this.phrasex
          .getWildcardsAndMatch(phrase, this.keywords, pFullUserData)
          .then(newRes => {
            //debug('matched phrases', newRes)
            return this.processResult(newRes, pFullUserData, pFullStore, false)
          })
          .catch(error => {
            Logger.error(error)
            //debug('error pFull', error)
            return Promise.resolve(Helper.failResponse)
          })

        Promise.all([pWord, pFull])
          .then(ans => {
            let pos = this.pos.getPartsOfSpeech(phrase)
            let nounScore = this.pos.getNounScore(pos)

            Logger.debug('ANSWER__________________', ans)
            //debug('ANSWER___________________________', ans)
            /*debug('pWord storage',pWordUserData.storage)
                    debug('pFull storage',pFullUserData.storage)
                    debug('pFullStore',pFullStore)*/

            //nounScore = 1.0;
            //debug('CONFIDENCE!',pos,ans[0].confidence, nounScore, ans[1].confidence)
            ans[0].confidence = ans[0].confidence * nounScore
            //debug('CONFIDENCE2!',pos,ans[0].confidence, nounScore, ans[1].confidence)

            if (ans[0].confidence > ans[1].confidence) {
              userData.shallowCopy(pWordUserData)
              /*userData.history = pWordUserData.history
                        userData.storage = pWordUserData.storage;
                        userData.searchRecord = pWordUserData.searchRecord;*/
              this.storage = pWordStore

              debug('userData.history2', userData.history)
              //debug('this.storage', this.storage)

              return resolve(ans[0])
            }

            //You can just copy this because this is defined in this class
            this.storage = pFullStore

            //You need to copy the members since userData is defined elsewhere
            userData.shallowCopy(pFullUserData)
            /*userData.storage = pFullUserData.storage
                    userData.history = pFullUserData.history
                    userData.searchRecord = pFullUserData.searchRecord*/

            debug('usreData.history', userData.history)
            //debug('this.storage', this.storage)

            return resolve(ans[1])
          })
          .catch(error => {
            debug('WEEE ARENT SUPPOSED TO BE IN HERE', error)
            resolve(Helper.failResponse)
          })
      } else {
        super
          .standardResult(phrase, userData, explicit)
          .then(ans => {
            resolve(ans)
          })
          .catch(reason => {
            resolve(Helper.failResponse)
            Logger.error(reason)
            debug('error standard', reason)
          })
      }
    })

    return np
  }

  /**
   * If the use types in a single word such as "tuna", the bot needs to expand
   * that word into a phrase such as "Where is the tuna" and then process it
   * @param word in this case is the word (can be multiple words "tuna salad")
   */
  respondToWord(word, userData, botStorage) {
    if (!this.doc) {
      return Promise.resolve(Helper.failResponse)
    }

    if (!this.doc.default) {
      return Promise.resolve(Helper.failResponse)
    }

    let newPhrase = slotFiller.reconstructPhrase(
      Helper.selectRandom(this.doc.default),
      { word: word }
    )

    Logger.warn(
      'Treating the phrase as a word',
      word,
      'Expanding to',
      newPhrase
    )
    let tp = this.phrasex.getWildcardsAndMatch(
      newPhrase.phrase,
      this.keywords,
      userData
    )

    return tp
      .then(tRes => {
        debug('tRES--------------------------------', tRes)
        return this.processResult(tRes, userData, botStorage, true, false)
      })
      .catch(reason2 => {
        if (reason2 == true) {
        } else {
          Logger.error(reason2)
        }
        return Promise.resolve(Helper.failResponse)
      })
  }
}

module.exports = PhrasexBot
