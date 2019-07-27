"use strict";

let Bot = require("sb/response/BasicBot.js");
let PhrasexBot = require("sb/response/PhrasexBot.js");
let StdBot = require("sb/boteng/BotEngineLib.js").StandardBotEngine;

class StandardPhrasexBot extends PhrasexBot {
  constructor(obj) {
    super(new StdBot(obj));
  }
}

class BasicBot extends Bot {
  constructor(obj) {
    super(new StdBot(obj));
  }
}

module.exports.StandardPhrasexBot = StandardPhrasexBot;
module.exports.BasicBot = BasicBot;
