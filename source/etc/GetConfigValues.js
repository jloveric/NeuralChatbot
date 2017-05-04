"use strict";

let instance = null;

/**
 * Gets data from the config.json file in the startup directory.  This
 * data includes server ports etc...
 * This class is a singleton, folloed the approach given here
 * 
 * http://amanvirk.me/singleton-classes-in-es6/
 */
class GetConfigValues {

	constructor() {

		if (!instance) {

			let fs = require('fs');
			this.baseDir = __dirname + '/';
			this.configFilename = this.baseDir + '../../config.json';
			let obj = JSON.parse(fs.readFileSync(this.configFilename, 'utf8'));

			//Copy the elements of the object to this
			Object.assign(this, obj)
			Object.seal(this);
			instance = this;
		}
		
		return instance;
	}

}

module.exports = GetConfigValues;