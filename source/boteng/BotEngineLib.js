"use strict";

let Formatting = require("sb/boteng/Formatting.js");
let BasicAction = require("sb/boteng/BasicAction.js");
let MoreBasicAction = require("sb/boteng/MoreBasicAction.js");
let NoSearchAction = require("sb/boteng/NoSearchAction.js");
let NoInfoAction = require("sb/boteng/NoInfoAction.js");
let HelpAction = require("sb/boteng/HelpAction.js");
let TopScoreAction = require("sb/boteng/TopScoreAction.js");
let IdentityAction = require("sb/boteng/IdentityAction.js");
let InfoAction = require("sb/boteng/InfoAction.js");
let ListAction = require("sb/boteng/ListAction.js");
let TellFilterAction = require("sb/boteng/TellFilterAction.js");
let PrivacyAction = require("sb/boteng/PrivacyAction.js");
let DynamicAction = require("sb/boteng/DynamicAction.js");
let WhatDidISayAction = require("sb/boteng/WhatDidISayAction.js");
let BotEngine = require("sb/boteng/BotEngine.js");

let StandardBotEngine = function(obj) {
  let be = new BotEngine();

  if (!obj) {
    be.addAction(new TellFilterAction());
    be.addAction(new WhatDidISayAction());
    be.addAction(new DynamicAction());
    be.addAction(new PrivacyAction());
    be.addAction(new InfoAction());
    be.addAction(new IdentityAction());
    be.addAction(new NoInfoAction());
    be.addAction(new NoSearchAction());
    be.addAction(new HelpAction());
    be.addAction(new ListAction());
    be.addAction(new TopScoreAction());
    be.addAction(new MoreBasicAction());
    be.addAction(new BasicAction());
  } else {
    if (!obj.files) {
      logAndThrowUndefined(
        "Action",
        obj.files[i],
        "does not have filterInput function"
      );
    }

    for (let i = 0; i < obj.files.length; i++) {
      let temp = require(obj.files[i]);

      let val = new temp();

      //Check
      if (typeof val.filterInput == "function") {
        logAndThrowUndefined(
          "Action",
          obj.files[i],
          "does not have filterInput function"
        );
      }

      if (typeof val.computeResult == "function") {
        logAndThrowUndefined(
          "Action",
          obj.files[i],
          "does not have computeResult function"
        );
      }

      be.addAction(val);
    }
  }

  return be;
};

module.exports.StandardBotEngine = StandardBotEngine;
