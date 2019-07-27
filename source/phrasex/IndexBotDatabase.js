"use strict";

let Logger = require("sb/etc/Logger.js")("IndexBotDatabase");
let GetConfigValues = require("sb/etc/GetConfigValues.js");
let MongoHelper = require("sb/extdb/MongoHelper.js");
let es = require("elasticsearch");
let IndexMongoDatabase = require("sb/extdb/IndexMongoDatabase.js");

/**
 * Use IndexMongoDatabase for the specific reason of indexing
 * the bots stored in the mongo database.
 */
class IndexBotDatabase extends IndexMongoDatabase {
  constructor() {
    super("botDatabase", "bots", "description", "bottable");
  }
}

module.exports = IndexBotDatabase;
