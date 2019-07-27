"use strict";

let Helper = require("sb/etc/Helper.js");
let Deque = require("collections/deque");
let debug = require("debug")("PhraseFrequency");

/**
 * This is a class for computing phrase type frequency, both
 * absolute type frequency and frequency of one phrase following
 * another.  When one phrase is written, what is the chance that another
 * phrase occurs as the next phrase, or the phrase following that.  I believe
 * these are actually skip-grams for phrases.  This resulting matrices are
 * stored in a sparse format so if we have N phrases, we do not store NXN
 * data to report the frequency, should be much smaller.
 */
class PhraseFrequency {
  constructor() {
    this.deque = new Deque();
    this.phraseFrequency = new Map();

    //Total number of times each entry appears
    this.absoluteFrequency = new Map();

    //Total number of entries
    this.numEntries = 0;

    //Total number of entries per phrase type per stage of the n-gram
    this.numEntriesPerStage = new Map();
  }

  initialize(nGramLength) {
    this.nGramLength = nGramLength;
  }

  /**
   * Returns the probability that a particular phrase is presented
   */
  getProbability(id) {
    let entriesForId = this.absoluteFrequency.get(id);
    return entriesForId ? entriesForId / this.numEntries : 0;
  }

  /**
   * Return the probability of id0 given that id1 occured at
   * at a given stage.  stage=0 means that id1 occured at the
   * previous step.  stage=1 means that id1 occured two steps
   * ago, etc...
   * @param id0 is the groupId to determine probability of
   * @param id1 is the groupId of the phrase that occured at stage
   * @param stage is the stage that id1 occured at.
   */
  getConditionalProbability(id0, id1, stage) {
    let thisStageRes = this.numEntriesPerStage.get(id1)[stage];
    let freq = this.phraseFrequency.get(id1)[stage];

    if (thisStageRes && freq) {
      let freqId0GivenId1 = freq.get(id0);
      return freqId0GivenId1 ? freqId0GivenId1 / thisStageRes : 0;
    }

    return 0;
  }

  /**
   * Increment a phrase groupId statistics given a new index representing
   * the sequence of phrases in time.
   * @param tMapArray is an array of maps for a given phrase groupId.
   * @param index is the list groupId indexes that followed a given
   * phrase.  So for example, index[0].gId is the id of the phrase
   * immediately following the given phrase, index[1].gId is the id
   * of the phrase following that etc...
   */
  incrementMapArrayFromIndex(tMapArray, index) {
    for (let i = 0; i < index.length; i++) {
      let val = tMapArray[i].get(index[i].gId);
      if (!val) val = 0;
      tMapArray[i].set(index[i].gId, val + index[i].confidence);
    }
  }

  /**
   * Increment the number of entries in each stage by the confidence
   * score.
   * @param groupIndex is the index of the phrase type
   * @param indexMap is an array containing a groupId and a confidence.
   * Since this is only counting the number of entries, groupId is ignored
   * and only the confidence score is used for the increment.
   */
  incremenNumEntriesPerStageFromIndex(groupIndex, indexMap) {
    let localInc = this.numEntriesPerStage.get(groupIndex);
    if (localInc) {
      for (let i = 0; i < indexMap.length; i++) {
        localInc[i] = localInc[i] + indexMap[i].confidence;
      }

      //this.numEntriesPerStage.set(groupIndex, localInc)
    } else {
      let temp = [];

      //Make room for the full size of the nGram
      for (let i = 0; i < this.nGramLength; i++) {
        temp.push(0);
      }

      for (let i = 0; i < indexMap.length; i++) {
        temp[i] = temp[i] + indexMap[i].confidence;
      }

      this.numEntriesPerStage.set(groupIndex, temp);
    }
  }

  /**
   * For computing absolute frequency of phrases.  This ignores
   * any n-grams and just counts the number of times a phrase
   * is used.  The value is incremented by the confidence so
   * if the confidence is only 50% then only half a frequency
   * increment is added.
   */
  incrementMapFromIndex(index, confidence) {
    let val = this.absoluteFrequency.get(index);
    if (!val) val = 0;
    this.absoluteFrequency.set(index, val + confidence);
  }

  /**
   * Add the statistics from a phrase to a much larger map.  Increment
   * various counters
   */
  archiveEntry(entry) {
    this.numEntries = this.numEntries + entry.confidence;
    this.incrementMapFromIndex(entry.groupIndex, entry.confidence);
    this.incremenNumEntriesPerStageFromIndex(
      entry.groupIndex,
      entry.indexMap,
      entry.confidence
    );

    let val = this.phraseFrequency.get(entry.groupIndex);

    if (!val) {
      let t = [];
      for (let i = 0; i < this.nGramLength; i++) {
        t.push(new Map());
      }

      this.incrementMapArrayFromIndex(t, entry.indexMap);
      this.phraseFrequency.set(entry.groupIndex, t);
    } else {
      //Add the new entry values.

      this.incrementMapArrayFromIndex(val, entry.indexMap);
      this.phraseFrequency.set(entry.groupIndex, val);
    }
  }

  sortArchive() {
    let nm = new Map();
    for (let key of this.phraseFrequency.keys()) {
      let a = [];
      for (let i = 0; i < this.nGramLength; i++) {
        let tMap = this.phraseFrequency.get(key);
        let temp = new Map([...tMap[i]].sort());
        a.push(temp);
      }
      nm.set(key, a);
    }

    return nm;
  }

  archiveRemaining() {
    while (this.deque.length) {
      this.archiveEntry(this.deque.shift());
    }
  }

  /**
   * Add a new phrase to the deque
   * @param phrase is the actual phrase to add along with its meta data
   * @param confidence is the confidence score (generally between 0 and 1).
   * This score is used as a multiplier in the process of generating the
   * distribution function.
   */
  addPhrase(phrase, confidence) {
    if (phrase.meta) {
      let groupIndex = phrase.meta.groupIndex;
      let length = this.deque.length;

      let count = 0;
      this.deque.forEach(entry => {
        if (entry.indexMap.length < this.nGramLength) {
          entry.indexMap.push({ gId: groupIndex, confidence: confidence });
        }
      });

      let obj = {
        indexMap: [],
        phrase: phrase,
        groupIndex: phrase.meta.groupIndex,
        confidence: confidence
      };

      this.deque.push(obj);

      //Add the statistics by archiving the information.
      if (this.deque.length > this.nGramLength) {
        let val = this.deque.shift();
        this.archiveEntry(val);
      }
    } else {
      debug("phrase.meta is not defined");
    }
  }
}

module.exports = PhraseFrequency;
