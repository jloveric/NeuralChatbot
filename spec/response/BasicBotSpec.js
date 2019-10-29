'use strict'

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = 'botDB.config'
let BasicBot = require('sb/response/PhrasexBotLib.js').BasicBot
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let UserData = require('sb/user/UserData.js')
let gc = new GetConfigValues()

let rootName = gc.bot.rootName

describe('Test the BasicBot - which is not attached to a database!', function() {
  it('Test store and retrieve data functions', function(done) {
    let bot = new BasicBot()
    let userData = new UserData()

    let storage = {
      set: { 'self:(column)': '(value)' },
      get: { 'self:(column)': '(value)' },
    }
    let wc = { column: 'name', value: 'john' }
    let wc2 = { column: 'name' }

    bot.storeData(storage, wc, userData, 'name')
    console.log(userData.storage.getObj())

    bot.retrieveData(storage, wc2, userData, 'name')

    console.log('wc2', wc2)
    expect(wc2.value).toBe('john')
    expect(wc2.column).toBe('name')

    done()
  }, 10000)

  it('Should Return Good values', function(done) {
    let conf = {
      fileDatabase: 'filesystem',
      user: 'root',
      filename: path,
      doc: {
        description: {
          name: rootName,
        },
      },
      phraseTable: 'dudephrases',
    }
    let bot = new BasicBot()
    bot.initialize(conf).then(() => {
      let pList = []
      console.log('Here I am')
      //Testing phrase forms variations
      pList.push(
        simpleTest(bot, 'What do you do for a living', '(pornstar|gigalo)')
      )
      pList.push(simpleTest(bot, 'Best movie?', 'aliens'))
      pList.push(simpleTest(bot, 'who is this?', '(' + rootName + '|talking)'))
      Promise.all(pList).then(ans => {
        console.log('ans', ans)
        bot.close()
        done()
      })
    })
  }, 10000)
})

var simpleTest = function(bot, phrase, keyword) {
  let userData = new UserData()
  userData.initialize()

  let p = new Promise((resolve, reject) => {
    bot
      .getResult(phrase, userData)
      .then(function(ans) {
        let result = ans.response
        console.log('phrase:', phrase)
        console.log('result:', result)

        let foundUndefined = result.match(/undefined/i)

        expect(result != '').toBeTruthy()
        expect(!foundUndefined).toBeTruthy()
        console.log('foundUndefined', foundUndefined)
        console.log('')

        if (keyword) {
          let foundKeyword = result.match(new RegExp(keyword, 'i'))
          console.log('foundKeyword', foundKeyword)
          expect(foundKeyword).toBeTruthy()
        }
        resolve()
      })
      .catch(function(reason) {
        console.log(reason)
        expect(false).toBeTruthy()
        resolve()
      })
  })

  return p
}

var simpleTestNot = function(bot, phrase, keyword) {
  let userData = new UserData()
  userData.initialize()

  let p = new Promise((resolve, reject) => {
    bot
      .getResult(phrase, userData)
      .then(function(ans) {
        let result = ans.response
        console.log('phrase:', phrase)
        console.log('result:', result)

        let foundUndefined = result.match(/undefined/i)

        expect(result != '').toBeTruthy()
        expect(!foundUndefined).toBeTruthy()
        console.log('foundUndefined', foundUndefined)
        console.log('')

        if (keyword) {
          let foundKeyword = result.match(new RegExp(keyword, 'i'))
          expect(foundKeyword).toBeFalsy()
        }
        resolve()
      })
      .catch(function(reason) {
        console.log(reason)
        expect(false).toBeTruthy()
        resolve()
      })
  })

  return p
}

var simpleEmpty = function(bot, phrase) {
  let userData = new UserData()
  userData.initialize()

  let p = new Promise((resolve, reject) => {
    bot
      .getResult(phrase, userData)
      .then(function(ans) {
        let result = ans.response
        console.log('phrase:', phrase)
        console.log('result:', result)

        let foundUndefined = result.match(/undefined/i)

        expect(result == '').toBeTruthy()
        expect(!foundUndefined).toBeTruthy()
        console.log('foundUndefined', foundUndefined)
        console.log('')
        //console.log('smartbot test 1', bot.keyword);
        //expect(bot.keyword == "tuna").toBeTruthy();
        resolve()
      })
      .catch(function(reason) {
        console.log(reason)
        expect(false).toBeTruthy()
        resolve()
      })
  })

  return p
}
