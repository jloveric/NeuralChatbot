'use strict'

let Logger = require('helper-clockmaker').Logger('MongoFilesystem')
let Mongo = require('mongodb')
let fs = require('fs')
let MongoHelper = require('../extdb/MongoHelper.js')
let Stream = require('stream')
let { Helper } = require('helper-clockmaker')
let GetConfigValues = require('../etc/GetConfigValues.js')
let debug = require('debug')('MongoFilesystem')

let gf = new GetConfigValues()

/**
 * This is a class for storing and retrieving 'files' from a mongodb
 * database.
 */
class MongoFilesystem {
  constructor() {
    this.mongod = new MongoHelper()
  }

  close() {
    //this.db.close();
    //do nothing.  Mongod is a singleton so can be closed elsewhere.
  }

  initialize(databaseName) {
    if (!databaseName) {
      Helper.logAndThrow('MongoFilesystem: No file database name set')
    }
    this.databaseName = databaseName
    Logger.debug('Initializing mongodb connection')
    let url = gf.mongodb.url
    let np = this.mongod.initialize(this.databaseName, url)

    //let self = this;
    //let tPromise = new Promise((resolve, reject) => {
    let tPromise = np
      .then(tDb => {
        this.db = tDb
        this.bucket = new Mongo.GridFSBucket(this.db)
        Logger.debug('Initialized mongo bucket')
        return Promise.resolve(true)
      })
      .catch(reason => {
        Logger.error('Mongodb connection error', reason)
        return Promise.reject()
      })
    //});

    return tPromise
  }

  //Needs testing
  getDatabaseNames(user) {
    let fileType = 'database'

    let cursor = this.bucket.find({
      'metadata.user': user,
      'metadata.fileType': fileType,
    })

    let np = new Promise((resolve, reject) => {
      cursor.toArray((err, docs) => {
        let filenames = []
        if (err) {
          Logger.error('getDatabaseNames', err)
          reject(err)
        } else {
          for (let i = 0; i < docs.length; i++) {
            filenames.push(docs[i].filename)
          }

          resolve(filenames)
        }
      })
    })

    return np
  }

  dropDatabase() {
    let np = new Promise((resolve, reject) => {
      this.db.dropDatabase((err, res) => {
        if (err) {
          Logger.error(err)
          reject()
        } else {
          Logger.warn('Dropped database')
          resolve()
        }
      })
    })
    return np
  }

  /**
   * Check to see if any file of the specific type
   * by the user exists.
   * This function return a promise which is true if the file exists
   * and false if the file does not exist.  Note that the promise is
   * only rejected if there is an error.
   */
  doesFileTypeExist(user, fileType) {
    let cursor = this.bucket.find(
      { 'metadata.user': user, 'metadata.fileType': fileType },
      { batchsize: 1 }
    )

    let np = new Promise((resolve, reject) => {
      cursor
        .count((err, count) => {
          Logger.debug('Number of files with signature', count)
          if (count > 0) {
            resolve(true)
          } else {
            resolve(false)
          }
        })
        .catch(reason => {
          reject()
        })
    })

    return np
  }

  /**
   * Check to see if a specific file exists
   * This function return a promise which is true if the file exists
   * and false if the file does not exist.  Note that the promise is
   * only rejected if there is an error.
   */
  doesFileExist(filename, user, fileType) {
    //debug('Crap do we get hre?')
    let cursor = this.bucket.find(
      { filename: filename, metadata: { user: user, fileType: fileType } },
      { batchsize: 1 }
    )

    let np = new Promise((resolve, reject) => {
      //debug('What about here?')
      cursor
        .count((err, count) => {
          Logger.debug('Number of files with signature', count)
          //debug('count',count)
          if (count > 0) {
            resolve(true)
          } else {
            resolve(false)
          }
        })
        .catch(reason => {
          reject()
        })
    })

    return np
  }

  deleteDocument(object) {
    let np = new Promise((resolve, reject) => {
      if (object) {
        //debug('object',object)
        let id = object._id

        this.bucket.delete(id, function(err) {
          if (err) {
            Logger.error('Could not delete mongo file', err)
            resolve(false)
          } else {
            Logger.info('Deleted mongo file')
            resolve(true)
          }
        })
      } else {
        Logger.warn('MongoFilesystem: file not found')
        resolve(true)
      }
    })

    return np
  }

  deleteFileType(user, fileType) {
    let cursor = this.bucket.find(
      { 'metadata.user': user, 'metadata.fileType': fileType },
      { batchsize: 1 }
    )

    let np = new Promise((resolve, reject) => {
      cursor
        .nextObject()
        .then(object => {
          let val = this.deleteDocument(object)
          val.then(res => {
            resolve(res)
          })
        })
        .catch(reason => {
          reject(reason)
        })
    })

    return np
  }

  /**
   * Return all documents of a given type, for example 'install'
   * return an array.
   * @param user is the username
   * @param fileType is the type of file.
   */
  getDocumentsOfType(user, fileType) {
    let cursor = this.bucket.find(
      { 'metadata.user': user, 'metadata.fileType': fileType },
      { batchsize: 1 }
    )

    let np = new Promise((resolve, reject) => {
      cursor.toArray((error, docs) => {
        debug('getDocumentOfType found', docs)
        if (error) {
          reject(error)
        } else if (!docs.length) {
          reject('No matches were found')
        } else {
          resolve(docs)
        }
      })
    })

    return np
  }

  deleteFile(filename, user, fileType) {
    let cursor = this.bucket.find(
      { filename: filename, metadata: { user: user, fileType: fileType } },
      { batchsize: 1 }
    )

    let np = new Promise((resolve, reject) => {
      cursor
        .nextObject()
        .then(object => {
          let val = this.deleteDocument(object)
          val.then(res => {
            resolve(res)
          })
        })
        .catch(reason => {
          reject()
        })
    })

    return np
  }

  /**
   * TODO: Pretty sure this.bucket.find is not doing what I want.  I think I need
   * to use the regular find function and then delete things.
   */
  deleteAllFiles(filename, user, fileType) {
    let cursor = this.bucket.find(
      { filename: filename, metadata: { user: user, fileType: fileType } },
      { batchsize: 1 }
    )

    //TODO: Not totally sure why this is working in the test
    //I assume each of the deleteDocument is async so
    //there is a chance a document is not deleted before
    //it is checked by another method.  It may work because
    //of qeueing in mongodb.
    let np = new Promise((resolve, reject) => {
      cursor.each((err, item) => {
        if (item) {
          this.deleteDocument(item)
        } else {
          resolve(true)
        }
      })
    })

    return np
  }

  deleteUserAccount(user) {
    let cursor = this.bucket.find({ 'metadata.user': user }, { batchsize: 1 })

    let pList = []
    let np = new Promise((resolve, reject) => {
      cursor.each((err, item) => {
        if (err) {
          Logger.error(err)
          reject()
        }

        if (item) {
          pList.push(this.deleteDocument(item))
        } else {
          Promise.all(pList).then(() => {
            resolve(true)
          })
        }
      })
    })

    return np
  }

  /**
   * Return a stream that can be written to
   * @filename is the name of the mongo file
   * @user is the user of the mongo file
   * @fileType is the type of file
   */
  getWriteFileStream(filename, user, fileType) {
    let writeStream = this.bucket.openUploadStream(filename, {
      metadata: { user: user, fileType: fileType },
    })

    return writeStream
  }

  /**
   * Return a stream to a mongo file
   * @filename is the name of the mongo file
   * @user is the user of the mongo file
   * @fileType is the type of file
   */
  getReadFileStream(filename, user, fileType) {
    let np = new Promise((resolve, reject) => {
      //Logger.warn('do I even get in here?')

      let filter = {
        filename: filename,
        metadata: { user: user, fileType: fileType },
      }
      this.db.collection('fs.files').findOne(filter, (err, item) => {
        if (err) {
          Logger.error("Couldn't find file", err, filename, user, fileType)
          reject(err)
        } else if (!item) {
          Logger.warn('Could not find file', filter, filename, user, fileType)
          reject('File ' + filename + ' not found')
        } else {
          Logger.debug('Getting stream for file')
          let downloadStream = this.bucket.openDownloadStream(item._id)
          resolve(downloadStream)
        }
      })
    })

    return np
  }

  getFileId(filename, user, fileType) {
    let np = new Promise((resolve, reject) => {
      //Logger.warn('do I even get in here?')

      let filter = {
        filename: filename,
        metadata: { user: user, fileType: fileType },
      }
      this.db.collection('fs.files').findOne(filter, (err, item) => {
        if (err) {
          Logger.error("Couldn't find file", err)
          reject()
        } else if (!item) {
          Logger.warn('Could not find file', filter)
          reject()
        } else {
          Logger.debug('Getting id for file', item, 'and search', filter)
          resolve(item._id)
        }
      })
    })

    return np
  }

  /**
   * Return the saved file as text
   * @filename is the name of the file in mongo
   * @user is the name of the user
   * @fileType is the type of file
   */
  getFileAsText(filename, user, fileType) {
    let CHUNKS_COLLECTION = 'fs.chunks'

    let p = this.getFileId(filename, user, fileType)

    let np = new Promise((resolve, reject) => {
      p.then(id => {
        Logger.debug('Finding chunks with id', id)
        let chunksQuery = this.db
          .collection(CHUNKS_COLLECTION)
          .find({ files_id: id })
        chunksQuery.toArray((error, docs) => {
          if (error) {
            Logger.error(error)
            reject()
          } else {
            let answer = ''
            for (let i = 0; i < docs.length; i++) {
              answer = answer + docs[i].data.toString()
            }
            //Logger.debug('Returning text',answer)
            resolve(answer)
          }
        })
      }).catch(reason => {
        reject(reason)
      })
    })

    return np
  }

  /**
   * Create a file from the disk to the mongodb database, removing
   * all files with the same name, user and fileType.
   * @param diskFile is the name of the file on disk
   * @param originalFile is the desired name of the file in mongodb
   * @param user is the user name
   * @param fileType is the type of file
   */
  replaceFileInMongo(diskFile, originalName, user, fileType) {
    let np = new Promise((resolve, reject) => {
      this.deleteAllFiles(originalName, user, fileType)
        .then(() => {
          return this.storeFileInMongo(diskFile, originalName, user, fileType)
        })
        .then(() => {
          resolve()
        })
        .catch(reason => {
          reject()
        })
    })

    return np
  }

  /**
   * Copy a file from the disk to the mongodb database.
   * @param diskFile is the name of the file on disk
   * @param originalFile is the desired name of the file in mongodb
   * @param user is the user name
   * @param fileType is the type of file
   */
  storeFileInMongo(diskFile, originalName, user, fileType) {
    let writeStream = this.bucket.openUploadStream(originalName, {
      metadata: { user: user, fileType: fileType },
    })

    // open a stream to the temporary file created by Express...
    let np = new Promise((resolve, reject) => {
      let rs = fs.createReadStream(diskFile)
      //debug('writeStream',writeStream)
      writeStream.on('finish', function() {
        Logger.info('Write stream finished', diskFile)
        resolve('Ok')
      })

      rs.on('error', function(err) {
        Logger.error('Error reading file', err)
        this.emit('end')
        reject(err)
      })

      rs.pipe(writeStream)
    })

    return np
  }

  /**
   * Copy text to the mongodb database as a file removing all files in
   * the database with the same search signature.
   * @param diskFile is the name of the file on disk
   * @param originalFile is the desired name of the file in mongodb
   * @param user is the user name
   * @param fileType is the type of file
   */
  replaceTextInMongo(text, originalName, user, fileType) {
    debug('TEXT', text, 'ORIGINALNAME', originalName)
    let np = new Promise((resolve, reject) => {
      this.deleteAllFiles(originalName, user, fileType).then(() => {
        this.storeTextInMongo(text, originalName, user, fileType)
          .then(() => {
            resolve()
          })
          .catch(reason => {
            reject()
          })
      })
    })

    return np
  }

  /**
   * Copy text to the mongodb database as a file.
   * @param diskFile is the name of the file on disk
   * @param originalFile is the desired name of the file in mongodb
   * @param user is the user name
   * @param fileType is the type of file
   */
  storeTextInMongo(text, originalName, user, fileType) {
    debug('inputs', text, originalName, user, fileType)
    let writeStream = this.getWriteFileStream(originalName, user, fileType)

    /*let writeStream = this.bucket.openUploadStream(originalName,
            { metadata: { user: user, fileType: fileType } });*/

    let np = new Promise((resolve, reject) => {
      debug('Stepping into promise')
      Logger.debug('stepping into promise')

      writeStream.on('finish', function() {
        Logger.info('Write stream finished')
        resolve('Ok')
      })

      let stream = new Stream()
      stream.readable = true

      stream.pipe = function(dest) {
        Logger.debug('piping to writer')
        dest.write(text, 'utf8', () => {
          Logger.info('finished writing')
          dest.end()
        })
        stream.emit('end')
        return dest
      }

      stream.on('error', function(err) {
        Logger.info('Error reading file')
        reject(err)
      })

      stream.pipe(writeStream)
    })

    return np
  }
}

module.exports = MongoFilesystem
