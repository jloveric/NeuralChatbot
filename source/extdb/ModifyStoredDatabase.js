"use strict";

let csv = require("csv");
let readline = require("linebyline");
let Logger = require("sb/etc/Logger.js")("ModifyStoredDatabase");
let MongoFilesystem = require("sb/extdb/MongoFilesystem.js");
let Helper = require("sb/etc/Helper.js");
let debug = require("debug")("ModifyStoredDatabase");

/**
 * Open the csv database and modify it.  Basically this adds a new
 * index to the csv file and dumps it out as a database.  The new
 * file can then be properly overwritten by elasticsearch.  The first
 * row is assumed to be the column names so it is dropped from
 * the database.  Keep this in mind!
 */
class ModifyStoredDatabase {
  constructor() {}

  /**
   * @param file is the file we are trying to open
   * @param user is the user asssociated with the file
   * @param extension is the extension of the file to modify
   * @param databaseName is the name of the database that
   * should be searched for the file.
   */
  initialize(file, user, extension, databaseName) {
    debug("In initialize with", file, user, extension, databaseName);

    let MongoFile = new MongoFilesystem();

    Logger.debug("Inside ModifyStoredDatabase");
    let np = new Promise((resolve, reject) => {
      MongoFile.initialize(databaseName).then(() => {
        /*let readStream = MongoFile.getReadFileStream(
                    file, user, extension);*/

        let p = MongoFile.getReadFileStream(file, user, extension);

        p.then(readStream => {
          let writeStream = MongoFile.getWriteFileStream(
            file,
            user,
            "database"
          );

          let rl = readline(readStream);

          /*let rl = readline.createInterface({
                        input: readStream,
                        terminal: false
                    });*/

          readStream.on("end", () => {
            Logger.warn("fileStreamTemp closed");
            //resolve();
            //rl.emit('end');
          });

          rl.on("close", () => {
            debug("closed");
          });

          writeStream.on("finish", () => {
            debug("closing stream");
            MongoFile.close();
            resolve();
          });

          let id = 0;

          let rlCount = 0;
          let parseCount = 0;
          rl.on("line", line => {
            this.line = line;
            rlCount++;

            //Skip over the first id since those are expected to be the column names
            if (rlCount > 1) {
              csv.parse(line, (err, sList) => {
                debug("line", line);
                if (err) {
                  Logger.error(err);
                  debug("error", err);
                  reject(err);
                  return;
                }

                let list = sList[0];
                //console.log('line',list)

                /*if (id == 0) {
                                    list.push(Helper.extraId);
                                } else {
                                    list.push(id)
                                }*/

                list.push(id);

                //We want each term surrounded in quotes so the
                //system doesn't get confused.
                for (let j = 0; j < list.length; j++) {
                  list[j] = '"' + list[j] + '"';
                }

                let newLine = list.join(",") + "\r\n";
                //debug('Writing line', newLine)
                writeStream.write(newLine, "utf8", error => {
                  parseCount++;
                  if (error) {
                    Logger.error(error);
                  }

                  //console.log(rlCount, parseCount)

                  //This is a hack and basically assumes that
                  //the write is slow enough that another readline
                  //occurs before the first write finishes.
                  if (rlCount - 1 == parseCount) {
                    writeStream.end();
                  }

                  //Logger.warn('Writing row', newLine)
                });

                id++;
              });
            }
          });
        }).catch(reason => {
          Logger.error(reason);
          debug("error", reason);
          reject(reason);
        });
      });
    });

    return np;
  }
}

module.exports = ModifyStoredDatabase;
