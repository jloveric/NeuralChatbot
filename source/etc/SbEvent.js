"use strict";

let Logger = require('sb/etc/Logger.js')('SbEvent')

const EventEmitter = require('events');

class MyEvent extends EventEmitter { }

const SbEvent = new MyEvent();

/*SbEvent.on('error', function (text) {
	console.log('error emitted', text, this);
	Logger.error('error emitted', text, this, function(){
		SbEvent.emit('error')
		//process.emit('exit')	
	});
})*/

SbEvent.on('close', function(){
	process.emit('exit')
})

module.exports = SbEvent;