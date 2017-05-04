"use strict";

/**
 * This is just meant to be a logger that has the same commands (that I use) as Winston
 * to log directly to the browser console instead.  I basically need it for the user interface
 * which may be browser based.
 */

let BrowserLogger = {
	
	//Normally apply(console,...) would be apply(this,..)
	//but it doesn't work that way in chrome, though it does
	//in node.  So this is the work around.
	info(arg) {
		console.log.apply(console, arguments);
	},
	
	debug(arg) {
		console.log.apply(console, arguments);
	},
	
	warn(arg) {
		console.log.apply(console, arguments);
	},
	
	verbose(arg) {
		console.log.apply(console, arguments);
	},
	
	error(arg) {
		console.log.apply(console, arguments);
	},
}

module.exports = BrowserLogger;