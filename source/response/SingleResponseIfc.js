"use strict";


let Helper = require('sb/etc/Helper.js')
let deepcopy = require('clone')

class SingleResponseIfc {
	
	constructor() {
	}

	getResult(searchText, userData, remember) {
		Helper.logAndThrow("Must override 'getResult(text)'");
	}

	initialize(confShallow) {
		return Promise.resolve();
	}

};

module.exports.SingleResponseIfc = SingleResponseIfc;