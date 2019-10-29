'use strict'

let csv = require('csv')
let readline = require('linebyline')
let Logger = require('sb/etc/Logger.js')('ProcessDatabase')
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let debug = require('debug')('ProcessDatabase')

/**
 * Open the csv database and extract the first 5 rows. At the
 * moment the top row is assumed to be the column names and
 * the extra rows are provided just so they can be used for
 * display purposes.
 */
class ProcessDatabase {
  constructor() {
    this.MongoFile = new MongoFilesystem()
  }

  close() {
    //this.MongoFile.close();
  }

  /**
   * @param file is the file we are trying to open
   * @param user is the user asssociated with the file
   * @param databaseName is the name of the database that
   * should be searched for the file.
   */
  initialize(file, user, databaseName) {
    return this.MongoFile.initialize(databaseName)
      .then(() => {
        console.log('Initialized Mongo')
        return this.MongoFile.getReadFileStream(file, user, 'databaseTemp')
      })
      .then(fileStream => {
        debug('Got the stream')
        let count = 0
        this.rows = []

        let np = new Promise((resolve, reject) => {
          let rl = readline(fileStream)

          rl.on('close', line => {
            rl.emit('end')
            resolve(this.rows)
            return
          })

          rl.on('line', line => {
            //console.log('line',line)

            csv.parse(line, (err, data) => {
              //console.log('data',data)

              if (err) {
                Logger.error(err)
                return reject()
              } else {
                if (count < 5) {
                  //Don't include the last index since it
                  //contains the id that was added by storebot.
                  let newData = []
                  for (let i = 0; i < data[0].length; i++) {
                    newData.push(data[0][i])
                  }

                  this.rows.push(newData)
                } else {
                  if (count == 5) {
                    Logger.info('Processed database:', file)
                    //console.log(this.rows)
                  }

                  rl.emit('close')
                }
              }

              count++
            })
          })
        })

        return np
      })
      .catch(reason => {
        Logger.error(reason)
        return Promise.reject(reason)
      })
  }

  //Assume there are column names and put in the first row
  getColumnNames() {
    return this.rows[0]
  }
}

module.exports = ProcessDatabase
