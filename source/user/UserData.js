"use strict";

let Deque = require("collections/deque");
let PhraseFrequency = require("sb/phrasex/PhraseFrequency.js");
let SearchRecord = require("sb/response/SearchRecord.js");
let deepcopy = require("clone");
let debug = require("debug")("UserData");

let GenerateObject = require("sb/phrasex/GenerateObject.js");

/**
 * This is a class which stores various session user data, it can also
 * pull up and store data from/to databases.
 */
class UserData {
  constructor() {
    this.phraseFrequency = new PhraseFrequency();
    this.history = new Deque();
    this.searchRecord = new SearchRecord();
    this.lastReply = null;

    //storage stores facts that the user states, such as
    //my name is (name).
    this.storage = new GenerateObject();
  }

  shallowCopy(other) {
    this.phraseFrequency = other.phraseFrequency;
    this.history = other.history;
    this.searchRecord = other.searchRecord;
    this.lastReply = other.lastReply;
    this.storage = other.storage;
  }

  initialize(gramDepth) {
    //saves up to 5 skipgrams for each phrase.
    //Only saves a single bi-gram
    this.gramDepth = gramDepth ? gramDepth : 1;

    debug("depth", this.gramDepth);
    this.phraseFrequency.initialize(this.gramDepth);
  }

  setLastReply(obj) {
    debug("obj", obj);
    this.lastReply = obj;
    this.searchRecord.setRecord(obj.result);
    this.searchRecord.setCursor(obj.startOffset);
  }

  getLastReply() {
    return this.lastReply;
  }

  getStorage() {
    return this.storage;
  }

  /*setSearchRecord(val) {
        this.searchRecord.setRecord(val);
    }*/

  getNextSearchResults(n) {
    return this.searchRecord.getNext(n);
  }

  getLastHistory() {
    return this.history.peekBack();
  }

  /**
   * Create a deep copy of the object being pushed into the history
   */
  unshiftHistory(res) {
    let ans = deepcopy(res);

    this.history.unshift(ans);
    if (this.history.length > 10) {
      this.history.pop();
    }
  }
}

module.exports = UserData;
