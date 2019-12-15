'use strict'

let Formatting = require('./Formatting.js')
let BasicAction = require('./BasicAction.js')
let MoreBasicAction = require('./MoreBasicAction.js')
let NoSearchAction = require('./NoSearchAction.js')
let NoInfoAction = require('./NoInfoAction.js')
let HelpAction = require('./HelpAction.js')
let TopScoreAction = require('./TopScoreAction.js')
let IdentityAction = require('./IdentityAction.js')
let InfoAction = require('./InfoAction.js')
let ListAction = require('./ListAction.js')
let TellFilterAction = require('./TellFilterAction.js')
let PrivacyAction = require('./PrivacyAction.js')
let DynamicAction = require('./DynamicAction.js')
let WhatDidISayAction = require('./WhatDidISayAction.js')
let BotEngine = require('./BotEngine.js')

let StandardBotEngine = function(obj) {
  let be = new BotEngine()

  if (!obj) {
    be.addAction(new TellFilterAction())
    be.addAction(new WhatDidISayAction())
    be.addAction(new DynamicAction())
    be.addAction(new PrivacyAction())
    be.addAction(new InfoAction())
    be.addAction(new IdentityAction())
    be.addAction(new NoInfoAction())
    be.addAction(new NoSearchAction())
    be.addAction(new HelpAction())
    be.addAction(new ListAction())
    be.addAction(new TopScoreAction())
    be.addAction(new MoreBasicAction())
    be.addAction(new BasicAction())
  } else {
    if (!obj.files) {
      logAndThrowUndefined(
        'Action',
        obj.files[i],
        'does not have filterInput function'
      )
    }

    for (let i = 0; i < obj.files.length; i++) {
      let temp = require(obj.files[i])

      let val = new temp()

      //Check
      if (typeof val.filterInput == 'function') {
        logAndThrowUndefined(
          'Action',
          obj.files[i],
          'does not have filterInput function'
        )
      }

      if (typeof val.computeResult == 'function') {
        logAndThrowUndefined(
          'Action',
          obj.files[i],
          'does not have computeResult function'
        )
      }

      be.addAction(val)
    }
  }

  return be
}

module.exports.StandardBotEngine = StandardBotEngine
