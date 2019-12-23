'use strict'

let Bot = require('../response/BasicBot.js')
let StdBot = require('../boteng/BotEngineLib.js').StandardBotEngine

class BasicBot extends Bot {
  constructor(obj) {
    super(new StdBot(obj))
  }
}

module.exports.BasicBot = BasicBot
