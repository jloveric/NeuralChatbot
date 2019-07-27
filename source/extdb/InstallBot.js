"use strict";

let Logger = require("sb/etc/Logger.js")("InstallBot");
let GetConfigValues = require("sb/etc/GetConfigValues.js");
let DeleteAccount = require("sb/extdb/DeleteUserAccount.js");
let MongoHelper = require("sb/extdb/MongoHelper.js");
let MongoFilesystem = require("sb/extdb/MongoFilesystem.js");
let CreateUser = require("sb/user/CreateUser.js");
let debug = require("debug")("InstallBot");
let jsonfile = require("jsonfile");
let BotInformation = require("sb/extdb/BotInformation.js");
let InstallAndIndex = require("sb/extdb/InstallAndIndex.js");
let Helper = require("sb/etc/Helper.js");
let filepath = require("filepath");
let ModifyStoredDatabase = require("sb/extdb/ModifyStoredDatabase.js");

let IndexMongoDatabase = require("sb/extdb/IndexMongoDatabase.js");
let BasicPhrasexDatabase = require("sb/phrasex/BasicPhrasexDatabase.js");

/**
 * This class is able to install an entire bot by calling the 'install'
 * function.  It is able to install from the disk user "install" or from
 * the mongo file system using "installFromMongo".  However, it requires that
 * the bot.install,bot.csv,b.boost already
 * exist in the mongoFilesystem if a mongo install is performed.  The
 * install generates the config and logstash
 * files as well as indexes the bot.csv in elastic search.  It also appears to
 * be capable of updating the bot database, indexing a phraseDatabase from
 * mongodb to elasticsearch.  In short it installs a database.  In addition
 *
 * The files the installer uses include
 * {name}.install  -- required since it describes the bot configuration
 * {name}.csv -- required for rdbms installs
 * {name}.json -- optional, but used if the user wants to override the default phrase database
 * {name}.boost -- optional, but used for boosting search results in rdbms database
 *
 * Install and InstallFromMongo should be the only functions you call unless you really
 * know what you are doing.
 */
class InstallBot {
  constructor() {
    this.gc = new GetConfigValues();
    this.createLogstash;
  }

  close() {
    this.bDb.close();
  }

  initialize() {
    this.bDb = null;
    let botDb = new MongoHelper();

    let p1 = botDb
      .initialize("botDatabase", this.gc.mongodb.url)
      .then(thatDb => {
        this.bDb = thatDb;
        return Promise.resolve();
      });

    return Promise.all([p1]);
  }

  /**
   * The .install file contains information about the bot.  Use that information
   * to update the bots.
   */
  createBotInfo(username, info) {
    let bi = new BotInformation();
    return bi
      .initialize(this.gc.mongodb.botDatabase, this.gc.mongodb.url, "bots")
      .then(() => {
        return bi.update(username, info);
      })
      .then(() => {
        debug("Finished bot information");

        let np = new Promise((resolve, reject) => {
          this.bDb
            .collection("bots")
            .findOne({ user: username }, (err, item) => {
              if (err) {
                debug("Couldn't find file", err);
                reject(err);
              } else if (!item) {
                debug("Could not find file");
                reject("file does not exist");
              } else {
                debug("Getting stream for file", item);
                resolve();
              }
            });
        });

        return np;
      })
      .catch(reason => {
        Logger.error(reason);
        return Promise.reject(reason);
      });
  }

  /**
   * Install a phrase database based on a json file from the mongo filesystem.
   */
  installPhraseDatabaseFromMongo(mongoName) {
    //let dbName = this.gc.mongodb.fileDatabase;

    let mfs = new MongoFilesystem(); //Adding this here so I can look at the files written

    let indexName = null;

    let ib = new IndexMongoDatabase("phrasedb", mongoName, null, mongoName);

    return ib
      .initialize()
      .then(() => {
        return ib.createElasticsearchDatabase();
      })
      .then(() => {
        return Promise.resolve();
      })
      .catch(reason => {
        Logger.error(reason);
        return Promise.resolve();
      });
  }

  //Assume the file is stored in mongo and install from there
  installDatabaseFromMongo(csvFile, user) {
    let dbName = this.gc.mongodb.fileDatabase;
    let dbModify = new ModifyStoredDatabase();
    debug("csvFile", csvFile, "user", user, "databaseTemp", dbName);
    return dbModify.initialize(csvFile, user, "databaseTemp", dbName);
  }

  //Assume the file is stored on the disk and install from
  installDatabase(path, csvFile, user) {
    debug("Trying to install database for", path, csvFile, user);
    let dbName = this.gc.mongodb.fileDatabase;
    let mfs = new MongoFilesystem(); //Adding this here so I can look at the files written

    return mfs
      .initialize(dbName)
      .then(() => {
        return mfs.replaceFileInMongo(path, csvFile, user, "databaseTemp");
      })
      .then(() => {
        return this.installDatabaseFromMongo(csvFile, user);
      });
  }

  registerEmptyUser(username, password) {
    let user = new CreateUser();
    user.initialize();
    return user.registerUser(username, password);
  }

  delAndRegisterUser(username, password, info) {
    debug("initializing", username, password, info);
    let delAccount = new DeleteAccount();

    return delAccount
      .deleteAccount({
        fileDatabase: "filesystem",
        messageDb: "messagedb",
        usernameDb: "useraccounts",
        user: username,
        mongoUrl: this.gc.mongodb.url,
        botDatabase: this.gc.mongodb.botDatabase
      })
      .then(() => {
        Logger.warn("Deleted account for", username);
        return this.registerEmptyUser(username, password);
      })
      .then(() => {
        debug("finished creating", username, "user");
        Logger.info("finished creating", username, "user");
        return this.createBotInfo(username, info);
      })
      .catch(reason => {
        debug("error", reason);
        Logger.error(reason);
        return Promise.reject(reason);
      });
  }

  /**
   * Install from mongo -- this assumes the install and csv file have
   * been stored in mongo.  Also, this does not delete existing accounts
   * @param username is the name of the user
   * @param filename is the base name of the installation file which
   * is already in the mongo filesystem.
   *
   * {name}.install needs to be in the mongo filesystem
   * {name}.csv needs to also be installed if an rdbms .install is used
   * {name}.boost is optional if an rdbms database is used
   * {name}.json is optional and indicates the alternate phrase database
   */
  installFromMongo(username, filename) {
    Helper.logAndThrowUndefined("Username must be defined", username);
    Helper.logAndThrowUndefined("filename must be defined", filename);

    let dbName = this.gc.mongodb.fileDatabase;
    let mfs = new MongoFilesystem();

    let np = new Promise((resolve, reject) => {
      this.initialize().then(() => {
        debug("done initializing", filename);

        let config;
        mfs
          .initialize(dbName)
          .then(() => {
            return mfs.getFileAsText(filename, username, "install");
          })
          .then(installFile => {
            let obj = JSON.parse(installFile);

            debug("obj is ", obj);

            config = obj.config;
            config.filesystem = this.gc.mongodb.fileDatabase;
            config.username = username;
            debug("config", config);
            this.csvFile = config.filename;

            debug("Before del and register");

            return this.createBotInfo(username, obj);
          })
          .then(() => {
            return this.installDatabaseFromMongo(this.csvFile, username);
          })
          .then(() => {
            let install = new InstallAndIndex();
            debug("Before creating", config);
            return install.create(config);
          })
          .then(() => {
            debug("Stepping into last set");
            //Try and install the json file, which may or may not
            //exist.  Resolve anyway though since by default it will
            //use the default phrase database.
            let phraseFile = null;
            let fileAsText = null;
            let tableName = null;
            mfs
              .getDocumentsOfType(username, "phrase")
              .then(files => {
                debug("got the documents", files);
                phraseFile = files[0].filename;
                return mfs.getFileAsText(phraseFile, username, "phrase");
              })
              .then(fileAsText => {
                debug("got the fileAsText");
                tableName = Helper.uniquePhraseIndexName(phraseFile, username);
                fileAsText = JSON.parse(fileAsText);
                return BasicPhrasexDatabase.generatePhraseDatabase(
                  null,
                  tableName,
                  fileAsText
                );
              })
              .then(() => {
                debug("InstallingPhraseDatabaseFromMongo");
                return this.installPhraseDatabaseFromMongo(tableName);
              })
              .then(() => {
                Logger.info("Installed phrase database");
                resolve();
              })
              .catch(reason => {
                Logger.error(
                  "Failed to install local phrase database for reason",
                  reason
                );
                resolve();
              });

            debug("Created");
          })
          .catch(reason => {
            Logger.error(reason);
            reject(reason);
          });
      });
    });

    return np;
  }

  /**
   * Install a bot from the disk
   * @param username is the name of the user
   * @param password is the password of the user
   * @param filename is {name}.install file
   */
  install(username, password, filename) {
    Helper.logAndThrowUndefined("Username must be defined", username);
    Helper.logAndThrowUndefined("password must be defined", password);
    Helper.logAndThrowUndefined("filename must be defined", filename);

    let np = new Promise((resolve, reject) => {
      this.initialize().then(() => {
        debug("done initializing", filename);

        jsonfile.readFile(filename, (err, obj) => {
          if (err) {
            debug("Error", err);
            reject();
            return;
          }

          debug("obj is ", obj);
          //ib.install(args.username, args.password, obj)

          let config = obj.config;
          config.filesystem = this.gc.mongodb.fileDatabase;
          config.username = username;
          debug("config", config);
          this.csvFile = config.filename;

          let csvFilePath = Helper.getDirectory(filename);
          let diskFile = csvFilePath + "/" + this.csvFile;

          debug("diskFile", diskFile);
          //this.path = filename;

          debug("Before del and register");
          this.delAndRegisterUser(username, password, obj)
            .then(() => {
              debug("Before installDatabase");
              return this.installDatabase(diskFile, this.csvFile, username);
            })
            .then(() => {
              let install = new InstallAndIndex();
              debug("Before creating", config);
              return install.create(config);
            })
            .then(() => {
              debug("Created");
              resolve();
            })
            .catch(reason => {
              reject(reason);
            });
        });
      });
    });

    return np;
  }
}

module.exports = InstallBot;
