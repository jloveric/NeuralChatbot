"use strict";

let Logger = require("sb/etc/Logger.js")("IndexMongoDatabase");
let GetConfigValues = require("sb/etc/GetConfigValues.js");
let MongoHelper = require("sb/extdb/MongoHelper.js");
let es = require("elasticsearch");
let async = require("async");
let debug = require("debug")("IndexMongoDatabase");

/**
 * Index a mongo db database collection with elasticsearch
 * The elasticsearch index has the same name as the mongo
 * database.
 */
class IndexMongoDatabase {
  /**
   * @param mongoDbName is the name of the mongo database and the
   * name of the elasticsearch index when createElasticSearchDatabase()
   * is called.  If indexTable is called then the default name can
   * be changed.
   * @param mongoTableName is the name of the mongo collection
   * in the database.
   * @optional fieldName is used if a subset of the mongo database is
   * to be indexed for example, if only the description field should
   * be indexed.  If this option doesn't exist then all fields are indexed.
   * @param indexName is the name of the actual index to create in
   * elasticsearch.
   */
  constructor(mongoDbName, mongoTableName, fieldName, indexName) {
    this.mongod = new MongoHelper();
    this.phrasedb = mongoDbName;
    this.indexName = indexName;
    this.phraseTable = mongoTableName;
    this.table = { data: [] };
    this.gf = new GetConfigValues();
    this.field = fieldName;
    this.esQ = null;
    //this.elasticsearch = es;
    this.client = new es.Client({
      host: this.gf.elasticsearch.host,
      requestTimeout: 60000
    });
  }

  close() {
    this.client.close();
  }

  initialize() {
    let np = this.mongod
      .initialize(this.phrasedb, this.gf.mongodb.url)
      .then(db => {
        this.db = db;
        Object.seal(this);
        return Promise.resolve(true);
      });

    return np;
  }

  //just to match mongo case
  dropTable(tableName) {
    let np = new Promise((resolve, reject) => {
      resolve();
    });
    return np;
  }

  /**
   * Remove the index, most likely the one you've created or want to create
   * @param tIndex is the index to remove
   */
  deleteElasticsearchIndex(tIndex) {
    let prom = new Promise((resolve, reject) => {
      this.client.indices.delete(
        {
          index: tIndex
        },
        (err, response) => {
          if (err) {
            Logger.warn(
              "Delete",
              tIndex,
              "elasticsearch error - most likely index does not exist"
            );
          }
          resolve();
        }
      );
    });
    return prom;
  }

  getDocumentCount(tIndex) {
    let np = new Promise((resolve, reject) => {
      this.client
        .count({ index: tIndex })
        .then(resp => {
          debug("document count", resp.count);
          resolve(resp.count);
        })
        .catch(reason => {
          debug("document count failed", reason);
          reject();
        });
    });

    return np;
  }

  index(tIndex, id, item) {
    let count = id;
    let np = new Promise((resolve, reject) => {
      this.client
        .index({
          index: tIndex,
          type: "pub",
          id: count,
          body: item
        })
        .then(() => {
          resolve();
        })
        .catch(error => {
          Logger.error("Create", tIndex, "elasticsearch index", error);
          reject();
        });
    });

    return np;
  }

  indexTable(tIndex, text) {
    if (text) {
      return this.indexTableFromText(tIndex, text);
    } else {
      return this.indexTableMongo(tIndex);
    }
  }

  subSet(tIndex, a, index) {
    if (index < a.length) {
      //debug('a[index]',a[index])
      return this.index(tIndex, index, a[index]);
    } else {
      return Promise.reject("finished");
    }
  }

  tQ(tIndex, a, index) {
    if (index < a.length) {
      debug("indexing", index, a.length);
      return this.subSet(tIndex, a, index)
        .then(() => {
          return this.tQ(tIndex, a, index + 1);
        })
        .catch(reason => {
          Logger.error(reason);
          debug("error", reason);
          return Promise.resolve();
        });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * In this case index the table from a text file instead of from a table in the phrasedb
   */
  indexTableFromText(tIndex, text) {
    debug("indexing table", tIndex);
    let count = 0;

    if (!text.data) {
      return Promise.reject("data field does not exist in text file");
    }

    let p = new Promise((res, rej) => {
      let pList = [];

      for (let i = 0; i < text.data.length; i++) {
        let item = text.data[i];

        if (item.length) {
          //debug('Indexing item', item)

          delete item["_id"];

          //If fieldname is defined only index a subset of the data
          if (this.fieldName) {
            item = item[this.fieldName];
          }

          //this.addToQ({index : tIndex, id : count, item : item}, null)

          let tp = this.index(tIndex, pList.length, item);
          //let tp = this.tQ(item)
          pList.push(tp);
          count++;
        } else {
          resolve();
        }
      }

      return Promise.all(pList)
        .then(() => {
          debug("COUNT", count);
          res(count);
          debug("Called res");
        })
        .catch(reason => {
          Logger.error(reason);
          rej();
        });
    });

    /*Make sure the data is actually written to the disk before returning.*/
    return p.then(tCount => {
      return this.client.indices.flush().then(() => {
        return Promise.resolve(tCount);
      });
    });
  }

  /**
   * Loop through every element in the table and add the element to the table
   * being sure to remove '_id' since it is reused in the table.  Note! the
   * index name must be lowercase.  Right now it defaults to only 1 shard.
   * @param tIndex is the name of the index to store the mongo data in
   */
  indexTableMongo(tIndex) {
    debug("indexing table", tIndex, this.phraseTable);
    let count = 0;

    let p = new Promise((res, rej) => {
      let pList = [];
      let tp = Promise.resolve();
      let np = new Promise((resolve, reject) => {
        this.db
          .collection(this.phraseTable)
          .find()
          .toArray((err, item) => {
            if (err) {
              Logger.error(err);
              rej0(err);
            }

            if (item) {
              debug("Indexing item", item);

              for (let i = 0; i < item.length; i++) {
                delete item[i]["_id"];
              }

              //If fieldname is defined only index a subset of the data
              if (this.fieldName) {
                item = item[this.fieldName];
              }

              //this.addToQ({index : tIndex, id : count, item : item}, null)
              tp = this.tQ(tIndex, item, 0).then(() => {
                resolve();
              });
              //tp = this.index(tIndex, pList.length, item)
              //pList.push(tp);

              count++;
            } else {
              resolve();
            }
          });
      });

      return np
        .then(() => {
          debug("COUNT", count);
          res(count);
          debug("Called res");
        })
        .catch(reason => {
          debug("error", reason);
          Logger.error(reason);
          rej();
        });
    });

    /*Make sure the data is actually written to the disk before returning.*/
    return p.then(tCount => {
      debug("finished indexing finally", tCount);
      return this.client.indices.flush({ waitIfOngoing: true }).then(() => {
        debug("flushing client", tCount);
        return Promise.resolve(tCount);
      });
    });
  }

  /**
   * Remove the exiting table and create the new one.
   * @param jsonObject is a jsonObject containing the phrase database information and is optional.  If
   * it is not include then it searches phrasedb for the correct phrase.
   */
  createElasticsearchDatabase(jsonObject) {
    debug("creating elastic search database");
    Logger.info("Indexing", this.phrasedb, "with name", this.indexName);

    let np = new Promise((resolve, reject) => {
      //Delete the mofo
      let prom = this.deleteElasticsearchIndex(this.indexName);

      //this.client.indices.create.spec.method = 'PUT';
      //recreate the index
      prom
        .then(() => {
          this.client.indices.create(
            {
              index: this.indexName,
              body: {
                settings: {
                  number_of_shards: 1,
                  similarity: {
                    mysim: {
                      type: "BM25",
                      b: 0.75,
                      k1: 1.2
                    }
                  }
                }
              }
            },
            (error, response) => {
              if (error) {
                Logger.error(error);
                return reject(error);
              }

              this.indexTable(this.indexName, jsonObject)
                .then(count => {
                  resolve(count);
                })
                .catch(reason => {
                  reject(reason);
                });
            }
          );
        })
        .catch(reason => {
          debug(reason);
          Logger.error(reason);
          reject();
        });
    });

    return np;
  }

  printTable() {
    console.log(this.table.data);
  }
}

module.exports = IndexMongoDatabase;
