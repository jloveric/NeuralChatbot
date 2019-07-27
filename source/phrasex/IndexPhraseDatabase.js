"use strict";

let Logger = require("sb/etc/Logger.js")("IndexPhraseDatabase");
let GetConfigValues = require("sb/etc/GetConfigValues.js");
let MongoHelper = require("sb/extdb/MongoHelper.js");
let es = require("elasticsearch");
let IndexMongoDatabase = require("sb/extdb/IndexMongoDatabase.js");

class IndexPhraseDatabase extends IndexMongoDatabase {
  constructor() {
    super("phrasedb", "phrase", null, "phrasedb");
  }
}

module.exports = IndexPhraseDatabase;
