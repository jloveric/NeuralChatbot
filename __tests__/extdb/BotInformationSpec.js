'use strict'

let BotInformation = require('../extdb/BotInformation.js')

let GetConfigValues = require('../etc/GetConfigValues.js')

let gc = new GetConfigValues()

let rootConfig = {
  info: {
    database: 'botDatabase',
    collection: 'bots',
    type: 'mongo2',
  },
  description: {
    name: 'firstName',
  },
}

let rootConfigRevert = {
  info: {
    database: 'botDatabase',
    collection: 'bots',
    type: 'mongo',
  },
  description: {
    name: 'secondName',
  },
}

let alternateConfig = {
  info: {
    database: 'botDatabase',
    collection: 'bots',
    type: 'mongo',
  },
  description: {
    name: 'secondName',
  },
}

describe('helper', function() {
  it('Should modify botDatabase and revert', function(done) {
    let bi = new BotInformation()

    bi.initialize(
      gc.mongodb.botDatabase,
      gc.mongodb.url,
      gc.mongodb.botCollection
    )
      .then(() => {
        return bi.update('testBot', rootConfig)
      })
      .then(() => {
        return bi.getDocument('testBot')
      })
      .then(doc => {
        expect(doc.info.type).toBe('mongo2')
        return bi.update('testBot', rootConfigRevert)
      })
      .then(doc => {
        return bi.update('anotherBot', alternateConfig)
      })
      .then(doc => {
        expect(doc).toBe(false)
        console.log("We shouldn't be in here")
        done()
      })
      .catch(reason => {
        expect(reason).toBe('BotName In Use')
        console.log('Good, an exception was thrown')
        done()
      })
  })
})
