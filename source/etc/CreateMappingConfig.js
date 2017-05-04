"use strict";

let Logger = require('./Logger.js')('CreateMappingConfig');
let Helper = require('./Helper.js');

/**
 * This a class for creating a mapping of database column names
 * to column names that can have associated actions from storebot.
 * A few valid names at the moment are 'item' and 'price'.
 */
class CreateMappingConfig {
	constructor() {
		this.mapping={};
	}

	/**
	 * Validate the current mapping so that no misnamed or unsupported
	 * elements are added.
	 */
	validate() {

		for (let i in this.mapping) {
			let found = false;
			for (let j of Helper.validMappingElements) {
				if (j == this.mapping[i]) {
					found = true;
					break;
				}
			}

			if (!found) {
				Logger.error('Mapping validation failed, element :', i, 'not found');
				return false;
			}
		}
		
		Logger.info("Mapping validation succeeded");
		return true;
	}

	/**
	 * Add an element to the map.
	 * @param element is the object element name in text
	 * @param columnName is the name of the database column
	 */
	addMapping(element, columnName) {
		this.mapping[element] = columnName;
	}
	
	getMapping() {
		return this.mapping;
	}
}

module.exports = CreateMappingConfig;