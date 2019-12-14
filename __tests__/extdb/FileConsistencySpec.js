'use strict'

let FileConsistency = require('sb/extdb/FileConsistency.js')
let ServerConfig = require('sb/etc/GetConfigValues.js')
let CreateDefaultMongoData = require('sb/extdb/CreateDefaultMongoData.js')
let DeleteAccount = require('sb/extdb/DeleteUserAccount.js')
let UpdateBotInformation = require('sb/extdb/BotInformation.js')

let fc = new FileConsistency()
let sc = new ServerConfig()
let cm = new CreateDefaultMongoData()

let delAccount = new DeleteAccount()

describe('FileConsistency', function() {
  it('Check no files', function(done) {
    delAccount
      .deleteAccount({
        fileDatabase: 'filesystem',
        messageDb: 'messagedb',
        usernameDb: 'useraccounts',
        user: 'neverBot',
        mongoUrl: sc.mongodb.url,
        botDatabase: sc.mongodb.botDatabase,
      })
      .then(() => {
        console.log('first check)')
        check(false, done)
      })
  })

  it('Check only filesystem', function(done) {
    createFile('neverBot', 'ca-500.csv').then(() => {
      console.log('second check')
      check(false, done)
    })
  })

  it('Check all files', function(done) {
    let bd = new UpdateBotInformation()
    bd.initialize(
      sc.mongodb.botDatabase,
      sc.mongodb.url,
      sc.mongodb.botCollection
    )
      .then(() => {
        return bd.update('neverBot', {
          a: 'thing',
          b: 'other',
          info: { database: 'ca-500.csv' },
          description: { name: 'notBot' },
        })
      })
      .then(() => {
        console.log('third check')
        check(true, done)
      })
  })

  /*it("Check all files with wrong bot database", function (done) {
		let bd = new UpdateBotInformation();
		bd.initialize(sc.mongodb.botDatabase, sc.mongodb.url, sc.mongodb.botCollection).then(()=>{
		bd.update("neverBot",{a : "thing", b: "other", info:{database : "ca-501.csv"}}, 
			sc.mongodb.botDatabase, sc.mongodb.url).then(()=>{
				check(false,done);
			})
		})
	})*/
})

var check = function(good, done) {
  console.log('Checking with good=', good)
  fc.checkConsistency({
    botDatabase: sc.mongodb.botDatabase,
    url: sc.mongodb.url,
    fileDatabase: sc.mongodb.fileDatabase,
    user: 'neverBot',
  })
    .then(() => {
      if (good) {
        expect(true).toBe(true)
      } else {
        expect(false).toBe(true)
      }
      done()
    })
    .catch(() => {
      if (good) {
        expect(false).toBe(true)
      } else {
        expect(true).toBe(true)
      }
      done()
    })
}

var createFile = function(user, csvFile) {
  let np = new Promise((resolve, reject) => {
    let dbName = 'filesystem'

    let mongoData = new CreateDefaultMongoData()
    mongoData
      .initialize('uploads', dbName, csvFile, user)
      .then(() => {
        resolve()
      })
      .catch(reason => {
        reject()
      })
  })

  return np
}
