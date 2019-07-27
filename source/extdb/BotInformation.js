"use strict";

let Logger = require("sb/etc/Logger.js")("BotInformation");
let MongoHelper = require("sb/extdb/MongoHelper.js");
let Es = require("sb/response/ElasticSearchQuery.js");
let debug = require("debug")("BotInformation");

/**
 * Simply updates the bot database.
 */
class BotInformation {
  constructor() {
    //this.es = new Es();
  }

  initialize(botDatabase, url, botCollection) {
    this.botDatabase = botDatabase;
    this.url = url;
    this.botCollection = botCollection;
    this.bd = new MongoHelper();

    return this.bd.initialize(this.botDatabase, this.url).then(db => {
      this.db = db;
      return Promise.resolve(true);
    });
  }

  /**
   * The bots need to have unique names so we need to check that a given
   * name is not already in use.
   */
  checkIfExists(command) {
    let np = new Promise((resolve, reject) => {
      this.db.collection(this.botCollection).findOne(command, (err, item) => {
        if (err) {
          Logger.error("getDocument: findOne error", err);
          reject();
        } else {
          if (item) {
            Logger.error("getDocument", item);
            resolve(item);
          } else {
            Logger.info(
              "getDocument: No",
              this.botDatabase,
              "document for",
              command,
              "Ok to upsert"
            );
            resolve(false);
          }
        }
      });
    });

    return np;
  }

  update(username, body, force) {
    let np = new Promise((resolve, reject) => {
      //First check if the bot name already exists for a username other than the name
      //specified in th input.
      this.checkIfExists({
        user: { $ne: username },
        "description.name": body.description.name
      })
        .then(ans => {
          //If it doesn't exist then do an upsert'
          if (!ans) {
            this.db
              .collection(this.botCollection)
              .updateOne(
                { user: username },
                { $set: body },
                { multi: false, upsert: true, w: 1 },
                (err, doc) => {
                  if (err) {
                    Logger.error("updateOne error", err);
                    reject();
                  } else {
                    resolve(true);
                    Logger.info("User", username, "Updated bot Information");
                  }
                }
              );
            debug("Updating bot");
          } else {
            debug("This bot is in use");
            Logger.error(
              "A different user is already using that bot name",
              ans
            );
            reject("BotName In Use");
          }
        })
        .catch(reason => {
          debug("Some other error occured");
          Logger.error(reason);
          reject(reason);
        });
    });

    return np;
  }

  findDocument(name) {}

  getDocument(username) {
    let np = new Promise((resolve, reject) => {
      this.db
        .collection(this.botCollection)
        .findOne({ user: username }, (err, item) => {
          if (err) {
            Logger.error("getDocument: findOne error", err);
            reject();
          } else {
            if (item) {
              Logger.info("getDocument", item);
              resolve(item);
            } else {
              Logger.error(
                "getDocument: No",
                this.botDatabase,
                "document for",
                username
              );
              reject();
            }
          }
        });
    });

    return np;
  }

  close() {}
}

module.exports = BotInformation;
