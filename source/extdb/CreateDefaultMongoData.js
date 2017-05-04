"use strict";

let Helper = require('sb/etc/Helper.js')
let Logger = require('sb/etc/Logger.js')('CreateDefaultMongoData')
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let ModifyStoredDatabase = require('sb/extdb/ModifyStoredDatabase.js')
let InstallAndIndex = require('sb/extdb/InstallAndIndex.js')

/**
 * For tests and when a user logs in for the first time we want
 * a default database installed into mongodb.
 */
class CreateDefaultMongoData {
	constructor() {
		this.installAndIndex = new InstallAndIndex();
	}

    /**
     * @diskDirectory is the directory on the disk where the data sits
     * @fileDatabase is the name of the database that stores the files
     * @startfile is the name of the csv file to use
     * @user is the user
     */
	initialize(diskDirectory, fileDatabase, startFile, user) {
		Logger.debug('Seeing if we need to create dummy files', startFile)
		let mongoFile;

		let dbModify = new ModifyStoredDatabase();

		let np = new Promise((resolve, reject) => {
			mongoFile = new MongoFilesystem()
			mongoFile.initialize(fileDatabase).then(() => {
				return mongoFile.doesFileExist(startFile, user, "database")
			}).then((exists) => {
				//mongoFile.doesFileTypeExist(user, "database").then((exists) => {	
				resolve(exists);
			}).catch((reason)=>{
				Logger.error(reason)
				reject(reason)
			})
		});


		let configFile = startFile + '.config';
		let logstashFile = startFile + '.logstash.static';

		//let configFile = startFile;
		//let logstashFile = startFile;

		let p =
			np.then((exists) => {
				if (!exists) {
					return mongoFile.storeFileInMongo(diskDirectory + '/' + startFile, startFile, user, 'databaseTemp').then(() => {
						return mongoFile.storeFileInMongo(diskDirectory + '/' + configFile, startFile, user, 'databaseConfig')
					}).then(() => {
						return mongoFile.storeFileInMongo(diskDirectory + '/' + logstashFile, startFile, user, 'logstash')
					}).then(() => {
						return dbModify.initialize(startFile, user, 'databaseTemp', fileDatabase)
					}).then(() => {
						Logger.info('Created files')
						mongoFile.close();
						return Promise.resolve();
					}).catch((reason)=>{
						Logger.error(reason)
					})
				} else {
					Logger.info('File already exists')
					return Promise.resolve();
				}
			}).catch((reason) => {
				Logger.error('Find failed', reason)
				return Promise.reject(reason);
			})


		return p;
	}

}

module.exports = CreateDefaultMongoData;