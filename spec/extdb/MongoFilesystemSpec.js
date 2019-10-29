'use strict'

let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let mongoText = 'It appears writing from text works'
let mongoText2 = 'No confusion'

describe('The MongoFilesystem should work.', function() {
  it('Write a file to the database', function(done) {
    let mongoFile = new MongoFilesystem()
    mongoFile
      .initialize('fileSystemTest')
      .then(() => {
        let p1 = mongoFile.deleteFile(
          'goodfile.txt',
          'john.loverich@gmail.com',
          'thisType'
        )
        let p2 = mongoFile.deleteFile(
          'goodfile.txt',
          'john.loverich@gmail.com',
          'otherType'
        )

        Promise.all([p1, p2])
          .then(function() {
            let np1 = mongoFile.storeFileInMongo(
              'spec/extdb/testfile.txt',
              'goodfile.txt',
              'john.loverich@gmail.com',
              'thisType'
            )
            let np2 = mongoFile.storeFileInMongo(
              'spec/extdb/testfile2.txt',
              'goodfile.txt',
              'john.loverich@gmail.com',
              'otherType'
            )

            Promise.all([np1, np2])
              .then(res => {
                console.log('success')
                expect(true).toBeTruthy()
                done()
              })
              .catch(reason => {
                console.log('failed', reason)
                expect(false).toBeTruthy()
                done()
              })
          })
          .catch(reason => {
            expect(false).toBeTruthy()
            Logger.error(reason)
            done()
          })
      })
      .catch(reason => {
        console.log('MongoFilesystem init failed', reason)
        expect(false).toBeTruthy()
        done()
      })
  }, 10000)

  it('Write a text to the database', function(done) {
    let mongoFile = new MongoFilesystem()
    mongoFile
      .initialize('fileSystemTest')
      .then(() => {
        let prom = mongoFile.deleteFile(
          'goodText.txt',
          'john.loverich@gmail.com',
          'thisType'
        )
        prom.then(function() {
          let np1 = mongoFile.storeTextInMongo(
            mongoText,
            'goodText.txt',
            'john.loverich@gmail.com',
            'thisType'
          )
          let np2 = mongoFile.storeTextInMongo(
            mongoText2,
            'goodText.txt',
            'john.loverich@gmail.com',
            'otherType'
          )

          Promise.all([np1, np2])
            .then(res => {
              console.log('success')
              expect(true).toBeTruthy()
              done()
            })
            .catch(reason => {
              console.log('failed', reason)
              expect(false).toBeTruthy()
              done()
            })
        })
      })
      .catch(reason => {
        console.log('MongoFilesystem init failed', reason)
        expect(false).toBeTruthy()
        done()
      })
  }, 10000)

  it('Should retrieve values from database', function(done) {
    let mongoFile = new MongoFilesystem()
    mongoFile
      .initialize('fileSystemTest')
      .then(() => {
        //let np = mongoFile.storeFileInMongo('spec/testfile.txt', 'goodfile.txt','john.loverich@gmail.com','thisType');
        let np1 = mongoFile.getFileAsText(
          'goodText.txt',
          'john.loverich@gmail.com',
          'thisType'
        )
        let np2 = mongoFile.getFileAsText(
          'goodText.txt',
          'john.loverich@gmail.com',
          'otherType'
        )
        let np3 = mongoFile.getDatabaseNames('john.loverich@gmail.com')
        let np4 = mongoFile.doesFileTypeExist(
          'john.loverich@gmail.com',
          'thisType'
        )

        Promise.all([np1, np2, np3, np4]).then(res => {
          expect(res[0]).toEqual(mongoText)
          expect(res[1]).toEqual(mongoText2)
          expect(res[3]).toEqual(true)
          done()
        })
      })
      .catch(reason => {
        console.log('MongoFilesystem init failed', reason)
        expect(false).toBeTruthy()
        done()
      })
  }, 10000)

  it('Should tell whether the file exists', function(done) {
    let mongoFile = new MongoFilesystem()
    mongoFile
      .initialize('fileSystemTest')
      .then(() => {
        return mongoFile.doesFileExist(
          'goodText.txt',
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(res => {
        expect(res).toEqual(true)
        return mongoFile.getDocumentsOfType(
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(tArray => {
        console.log(tArray)
        expect(tArray.length).toBe(2)
        return mongoFile.deleteAllFiles(
          'goodText.txt',
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(() => {
        return mongoFile.doesFileExist(
          'goodText.txt',
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(res2 => {
        console.log('res2', res2)
        expect(res2).toEqual(false)
        return mongoFile.getDocumentsOfType(
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(tArray => {
        console.log('last set', tArray)
        expect(tArray.length).toBe(1)
        return mongoFile.deleteFileType('john.loverich@gmail.com', 'otherType')
      })
      .then(() => {
        return mongoFile.doesFileTypeExist(
          'john.loverich@gmail.com',
          'otherType'
        )
      })
      .then(ans => {
        console.log('ans', ans)
        expect(ans).toBe(false)
        done()
      })
      .catch(reason => {
        expect(true).toBe(false)
        console.log('DoesFileExist failed', reason)
        done()
      })
  }, 10000)
})
