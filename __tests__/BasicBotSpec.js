'use strict'

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = 'botDB.config'
let BasicBot = require('../source/response/PhrasexBotLib.js').BasicBot
//let GetConfigValues = require('../../source/etc/GetConfigValues.js')
let { UserData } = require('neural-phrasex')
let gc = {} //new GetConfigValues()
let dudeDatabase = require('../phrasedatabases/TestDatabase.js')

let rootName = "Godzilla"

describe('Test the BasicBot - which is not attached to a database!', function () {
  
  it('Testing the PhrasexBot history starting with complete phrase', async (done)=> {
    let conf = {
      database: dudeDatabase,
      user: 'root',
      doc: {
        description: {
          name: rootName,
        },
      }
    }
    
    let userData = new UserData()
    userData.initialize(1)

    let bot = new BasicBot()
    
    await bot.initialize(conf)
      
    await simpleTest(bot, 'What do you do for a living', '(batman|fisherman)', userData)

    await simpleTest(
              bot,
              'What did I say',
              'What do you do for a living',
              userData
            )
    done()

  }, 10000)

  
  it('Test store and retrieve data functions', function (done) {
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

  it('Should Return Good values', async function (done) {

    let userData = new UserData()
    userData.initialize()

    let conf = {
      database: dudeDatabase,
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
    await bot.initialize(conf)

    let pList = []
    console.log('Here I am')

    //Testing phrase forms variations
    await simpleTest(bot, 'What do you do for a living', '(batman|fisherman)', userData)
    await simpleTest(bot, 'Best movie?', 'aliens', userData)

    //TODO: Make this one below work again!
    //await simpleTest(bot, 'who is this?', '(' + rootName + '|talking)')

    done()

  }, 10000)

  it('Document questions should work', async function (done) {

    let userData = new UserData()
    userData.initialize()

    let conf = {
      database: dudeDatabase,
      fileDatabase: 'filesystem',
      user: 'root',
      filename: path,
      doc: {
        description: {
          name: rootName,
          help: "This is a simple help message"
        },
      },
      phraseTable: 'dudephrases',
    }
    let bot = new BasicBot()
    await bot.initialize(conf)

    let pList = []
    console.log('Here I am')

    //Testing phrase forms variations
    await simpleTest(bot, 'Help', 'This is a simple help message', userData)

    //TODO: Make this one below work again!
    await simpleTest(bot, 'who is this?', '(' + rootName + '|talking)', userData)

    done()

  }, 10000)

})

//TODO: convert to await when you have time!
var simpleTest = async function (bot, phrase, keyword, userData) {
  

  //let p = new Promise((resolve, reject) => {
  let ans = await bot.getResult(phrase, userData)

  let result = ans.response
  console.log('phrase:', phrase)
  console.log('result:', result)

  let foundUndefined = result.match(/undefined/i)

  expect(result != '').toBeTruthy()
  expect(!foundUndefined).toBeTruthy()
  console.log('foundUndefined', foundUndefined)
  console.log('')

  if (keyword!=null) {
    let foundKeyword = result.match(new RegExp(keyword, 'i'))
    console.log('foundKeyword', foundKeyword)
    expect(foundKeyword!=null).toBeTruthy()
  }
  
}

var simpleTestNot = function (bot, phrase, keyword) {
  let userData = new UserData()
  userData.initialize()

  let p = new Promise((resolve, reject) => {
    bot
      .getResult(phrase, userData)
      .then(function (ans) {
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
      .catch(function (reason) {
        console.log(reason)
        expect(false).toBeTruthy()
        resolve()
      })
  })

  return p
}

var simpleEmpty = function (bot, phrase) {
  let userData = new UserData()
  userData.initialize()

  let p = new Promise((resolve, reject) => {
    bot
      .getResult(phrase, userData)
      .then(function (ans) {
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
      .catch(function (reason) {
        console.log(reason)
        expect(false).toBeTruthy()
        resolve()
      })
  })

  return p
}
