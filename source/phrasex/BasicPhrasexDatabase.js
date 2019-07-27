"use strict";

let Logger = require("sb/etc/Logger.js")("BasicPhrasexDatabase");
let PhraseDatabase = require("sb/phrasex/PhraseDatabase.js");
let jsonFile = require("jsonfile");
let debug = require("debug")("BasicPhrasexDatabase");
let Helper = require("sb/etc/Helper.js");

module.exports = {
  expandFiles(filename) {
    let jsFile = jsonFile.readFileSync(filename);
    if (!jsFile) {
      Logger.error("Could not open file", filename);
    }

    try {
      let pList = [];

      let dir = Helper.getDirectory(filename);

      debug("jsFile", jsFile);

      let include = jsFile.include;
      if (include) {
        //include the file in the object - non recursive.
        for (let i = 0; i < include.length; i++) {
          let newFileName = dir + "/" + include[i];
          debug(newFileName);
          let newFile = this.expandFiles(newFileName);
          if (newFile) {
            debug("Opened file", newFileName);
            if (newFile.definitions) {
              if (!jsFile.definitions) jsFile.definitions = {};
              for (let j in newFile.definitions) {
                jsFile.definitions[j] = newFile.definitions[j];
              }
            }
            if (newFile.data) {
              for (let j = 0; j < newFile.data.length; j++) {
                jsFile.data.push(newFile.data[j]);
              }
            }
          } else {
            debug("file", newFileName, "Was not found");
            Logger.error("file", newFileName, "Was not found");
          }
        }
      }
    } catch (e) {
      debug("error", e);
      Logger.error(e);
    }

    return jsFile;
  },

  subSet(a, index, definitions, pdb) {
    if (index < a.length) {
      //let p = Promise.resolve();
      let pList = [];
      for (let i = 0; i < a[index].length; i++) {
        pList.push(pdb.addGroup(a[index][i], definitions));
      }

      return Promise.all(pList);
    } else {
      return Promise.resolve();
    }
  },

  tQ(a, index, definitions, pdb) {
    if (index < a.length) {
      return this.subSet(a, index, definitions, pdb)
        .then(() => {
          return this.tQ(a, index + 1, definitions, pdb);
        })
        .catch(reason => {
          Logger.error(reason);
          debug("error", reason);
          return Promise.resolve();
        });
    } else {
      return Promise.resolve();
    }
  },

  /**
   * Generate a phrase database file from the filename, if fileAsText
   * is supplied then just translate the text into the database
   * @param filename is the name of the file
   * @param tableName is the name of the table as it should appear in mongo
   * @param fileAsText is a jsonObject that can be used instead of
   * reading from the hard drive.
   */
  generatePhraseDatabase: function(filename, tableName, fileAsText) {
    //So it works with all the old stuff.
    if (!tableName) {
      tableName = "phrase";
    }

    let pdb = new PhraseDatabase();
    return pdb
      .initialize({ phraseTable: tableName })
      .then(() => {
        return pdb.dropTable(tableName);
      })
      .then(() => {
        debug("Finished dropping table");

        let pList = [];
        let jsFile = fileAsText;

        if (!jsFile) {
          jsFile = this.expandFiles(filename);
        }

        debug("jsFile phrases", jsFile.data.length);

        let a = [];
        let count = 0;
        while (count < jsFile.data.length) {
          let b = [];

          for (let j = 0; j < 10; j++) {
            if (jsFile.data[count]) {
              b.push(jsFile.data[count]);
              count++;
            }
          }

          a.push(b);
        }

        let definitions = jsFile.definitions;

        let p = this.tQ(a, 0, definitions, pdb);

        /*for (let h = 0; h < a.length; h++) {

				//let p = Promise.resolve();
				p = this.subSet(a, h, definitions)
				p = p.then(() => {

				})

				for (let i = 0; i < a[h].length; i++) {
					if (i != (a[h].length - 1)) {
						pdb.addGroup(a[h][i], definitions)
					} else {
						pList.push(pdb.addGroup(a[h][i], definitions))
					}
				}
			}*/

        //I'm assuming data is queued and this is the last in the queue so
        //when its done, I can close.
        return p
          .then(() => {
            debug("Finished creating phrase mongo database");
            Logger.info("closing");
            return Promise.resolve(pdb.count);
          })
          .catch(reason => {
            Logger.error("failed", reason);
            return Promise.reject();
          });
      })
      .catch(reason => {
        Logger.error("Error", reason);
        pdb.close();
        return Promise.reject();
      });
  }
};

//module.exports.generatePhraseDatabase();
