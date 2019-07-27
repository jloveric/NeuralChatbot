"use strict";

let events = require("events");
let debug = require("debug")("LocalClient");

/**
 * This a 'client' for recieving responses from the bot
 * that just stores information in a container instead of
 * sending to browser etc...
 */
class LocalClient {
  constructor() {
    this.messageList = [];
    this.eventEmitter = new events.EventEmitter();
  }

  send(msg) {
    this.messageList.push(msg);
    this.eventEmitter.emit("send");
    debug(msg);
  }

  getMessages() {
    return this.messageList;
  }

  setSendEvent(callback) {
    this.eventEmitter.on("send", callback);
  }
}

module.exports = LocalClient;
