'use strict'
let ProcessDatabase = require('sb/extdb/ProcessDatabase.js')
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let ModifyStoredDatabase = require('sb/extdb/ModifyStoredDatabase.js')

let fileDB = 'filesystem'

describe('ProcessDatabase', function() {
  it('Should process the database', function(done) {
    //First we need to write a file to the database
    //first copy the file to mongodb
    let mongoFile = new MongoFilesystem()
    let dbModify = new ModifyStoredDatabase()

    let prom = mongoFile
      .initialize(fileDB)
      .then(() => {
        let p1 = mongoFile.deleteFile(
          'groceries.csv',
          'john.loverich@gmail.com',
          'databaseTemp'
        )
        let p2 = mongoFile.deleteFile(
          'groceries.csv',
          'john.loverich@gmail.com',
          'database'
        )
        return Promise.all([p1, p2])
      })
      .then(() => {
        return mongoFile.storeFileInMongo(
          'uploads/groceries.csv',
          'groceries.csv',
          'john.loverich@gmail.com',
          'databaseTemp'
        )
      })
      .then(() => {
        console.log('finished mongo work')
        return dbModify.initialize(
          'groceries.csv',
          'john.loverich@gmail.com',
          'databaseTemp',
          fileDB
        )
      })
      .then(() => {
        console.log('Promise succeeded')
        //Then lets see if we can stream it
        let pd = new ProcessDatabase()

        let np = pd.initialize(
          'groceries.csv',
          'john.loverich@gmail.com',
          fileDB
        )

        np.then(function(data) {
          console.log('found data', data)
          let names = pd.getColumnNames()

          console.log(names)
          expect(names[0]).toBe('aisle')
          expect(names[1]).toBe('aisleid')
          expect(names[2]).toBe('item')
          expect(names[3]).toBe('price')
          done()
        })
      })
  }, 5000)
})
