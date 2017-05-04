"use strict";

let Logger = require('sb/etc/Logger.js')('ExitHandler');

//function noOp() { };

/**
 * Copied from stackoverflow
 * http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
 * This allows you to perform some operations (destruction) when
 * the process exits for whatever reason.  I basically need it to make
 * sure I kill spawned processes like logstash or elasticsearch. 
 */
class Cleanup {

	constructor(callback) {
		
		Logger.info('Initializing process exit')
		
		//Prevent program from closing instantly
		process.stdin.resume();
		
		// attach user callback to the process event emitter
		// if no callback, it will still exit gracefully on Ctrl-C
		//callback = callback || noOp;
		process.on('cleanup', callback);

		// do app specific cleaning before exiting
		process.on('exit', function () {
			Logger.info('Cleanup. Exiting.')
			process.emit('cleanup');
		});

		// catch ctrl+c event and exit normally
		process.on('SIGINT', function () {
			Logger.info('Ctrl-C...');
			process.exit(2);
		});

		//catch uncaught exceptions, trace, then exit normally
		process.on('uncaughtException', function (e) {
			Logger.error('Uncaught Exception...');
			Logger.error(e.stack);
			process.exit(99);
		});
	}
	
};

module.exports = Cleanup;