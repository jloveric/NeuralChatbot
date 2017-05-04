"use strict";

let Logger = require('sb/etc/Logger.js')('GetDataConfig');
let Helper = require('sb/etc/Helper.js');
//let fs = require('fs');
let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
let debug = require('debug')('GetDataConfig')

/**
 * Gets the data for computing answers on the database.  Maps
 * database columns to 'universal' columns etc...
 */
class GetDataConfig {

	constructor() {
	}

	/**
	 * @param database is the name of the filesystem database
	 * @param filename is the name of the file stored in the database
	 * @param user is the name of the user associated with the file
	 */
	initialize(conf) {

		if (!Helper.hasProperties(conf, ['fileDatabase', 'filename', 'user'])) {
			Helper.logAndThrow('Configuration has undefined properties')
		}

		let database = conf.fileDatabase;
		let filename = conf.filename;
		let user = conf.user;

		//Logger.info('Configuring with', database, filename, user)

		this.MongoFile = new MongoFilesystem();
		let p = new Promise((resolve, reject) => {
			this.MongoFile.initialize(database).then(() => {
				this.MongoFile.getFileAsText(filename, user, "databaseConfig").then((res) => {

					debug('databaseDownload', res)
					//Logger.info('Loading configuration', res);
					//console.log('further',res)
					let obj = JSON.parse(res);


					Helper.logAndThrowUndefined('Must specify primary rows in the configuration file', obj.primary, true)


					//Copy the object into this please!
					for (let i in obj) {
						this[i] = obj[i];
					}

					//This needs to be explicitly converted back to a map
					this.synonyms = new Map(obj.synonyms)

					if (this.checkHasDatabaseNameMapping()) {
						//Logger.debug('DataConfig has databaseNameMapping', this.databaseNameMapping);
					} else {
						Logger.error('DataConfig is missing databaseNameMapping');
					}

					if (this.checkHasSynonyms()) {
						//Logger.debug('DataConfig has synonyms', this.synonyms);
					} else {
						Logger.error('DataConfig is missing synonyms');
					}

					Object.seal(this);

					//this.logConfiguration()

					resolve();

				}).catch((reason) => {
					Logger.error('GetDataConfig : Failed to find file', filename, 'user', user, 'reason', reason)
					reject();
				})
			})
		});

		return p;
	}

	logConfiguration() {
		Logger.info("Configuration")
		for (let i in this) {
			if (this[i] != undefined) {
				Logger.info(i, "=", this[i]);
			} else {
				Logger.error(i, "=", this[i]);
			}
		}
	}

	checkHasSynonyms() {
		if (this.synonyms) {
			return true;
		}
		return false;
	}

	checkHasDatabaseNameMapping() {
		if (this.databaseNameMapping) {
			return true;
		}
		return false;
	}

}

module.exports = GetDataConfig;