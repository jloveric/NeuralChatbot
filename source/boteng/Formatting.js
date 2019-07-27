"use strict";

let Helper = require("sb/etc/Helper.js");
let Logger = require("sb/etc/Logger.js")("Formatting");
let debug = require("debug")("Formatting");
let slotFiller = require("sb/phrasex/SlotFiller.js");
let deepcopy = require("clone");

/**
 * Take in a bunch of replies and wildcards along with elasticsearch
 * results and format the results.
 */
let databaseContents = function(obj, userData) {
  let replyTemplate = obj.replyTemplate;
  let wildcards = obj.wildcards;
  let results = obj.results;
  let columnMap = obj.columnMap;
  let columnType = obj.columnType;
  let columnSynVector = obj.columnSynVector;
  //let phrasex = obj.phrasex
  let confidence = obj.confidence;
  let rename = obj.columnReName;

  //Make sure these are defined
  Helper.hasProperties(obj, [
    "replyTemplate",
    "wildcards",
    "results",
    "columnMap",
    "columnType",
    "columnSynVector",
    "confidence"
  ]);

  let val = results;

  let tSet = []; //new Set()
  let actualCount = 0;
  let wcList = [];
  let searchResult = [];

  debug("source", val);

  let slotScore = 0;
  for (let id = 0; id < val.length; id++) {
    let wcCopy = deepcopy(wildcards);

    let score = val[id]._score;
    let source = val[id]._source;
    let highlight = val[id].highlight;

    let tClass = replyTemplate.implies.join(",");

    let columnProperty = null;
    let columnId = columnType.get(tClass);

    debug("columnId", columnId);

    if (columnId) {
      columnProperty = Helper.findProperty(source, columnId);
    }

    if (columnProperty && columnProperty.length > 0) {
      wcCopy.value = Helper.getObjElementArray(source, columnProperty);
      wcCopy[columnId] = wcCopy.value;

      searchResult.push(wcCopy.value);

      wcList.push(wcCopy);
      Logger.debug("wildcards", wcCopy, "column name", columnId);
      if (actualCount == 0) {
        let slot = slotFiller.reconstructPhrase(replyTemplate.phrase, wcCopy);
        slotScore = slot.score;
        tSet.push(slot.phrase);
      } else {
        let slot = slotFiller.reconstructPhrase(
          replyTemplate.continue[0],
          wcCopy
        );
        slotScore = slot.score;
        tSet.push(slot.phrase);
      }
      actualCount++;
    }
  }

  debug("wcList", wcList);
  debug("searchResult", searchResult);

  let finalArray = [...tSet];
  let finalAns = {
    response: finalArray.join("\n"),
    wildcards: wcList,
    phrase: replyTemplate,
    success: true,
    confidence: confidence,
    searchResult: searchResult,
    slotScore: slotScore
  };

  return finalAns;
};

let none = function(obj, userData) {
  Helper.hasProperties(obj, ["replyTemplate", "wildcards", "confidence"]);

  let replyTemplate = obj.replyTemplate;
  let wildcards = obj.wildcards;
  //let phrasex = obj.phrasex
  let confidence = obj.confidence;

  let res = slotFiller.reconstructPhrase(replyTemplate.phrase, wildcards);

  let finalAns = {
    response: res.phrase,
    wildcards: [wildcards],
    phrase: replyTemplate,
    success: true,
    confidence: confidence,
    slotScore: res.score
  };

  return finalAns;
};

let fromStorage = function(obj, userData) {
  debug("Did I even get in here?");
  Helper.hasProperties(obj, ["replyTemplate", "wildcards", "confidence"]);

  let replyTemplate = obj.replyTemplate;
  let storageWildcards = obj.storageWildcards;
  let wildcards = obj.wildcards;
  //let phrasex = obj.phrasex
  let confidence = obj.confidence;

  debug("replyTemplate", replyTemplate);
  let res = slotFiller.reconstructPhrase(replyTemplate.phrase, wildcards);
  let finalAns;
  debug("res", res);
  if (res.phrase.match(/null/i)) {
    finalAns = {
      response: "",
      wildcards: [wildcards],
      phrase: replyTemplate,
      success: false,
      confidence: 0,
      slotScore: 0
    };
  } else {
    finalAns = {
      response: res.phrase,
      wildcards: [wildcards],
      phrase: replyTemplate,
      success: true,
      confidence: confidence,
      slotScore: res.score
    };
  }

  return finalAns;
};

/**
 * Take in a bunch of replies and wildcards along with elasticsearch
 * results and format the results. obj has the following variables
 * @param obj {
 *      replyTemplate : the template that will be used in the reply,
 *      wildcards : an object containing wild card values {item : 'a', column : 'b'},
 *      results : an array of elasticsearch results,
 *      columnMap : maps a word (synonym) to the keyword, row->aisle for example,
 *      rename : columnName to keyword object,
 *      columnType : columnName to type so type is like place, price, location
 *      columnSynVector : the revers of columnMap, every keyword has an array of synonyms
 * }
 * @param userData is a UserData object which records, among other things, past queries.
 *
 */
let standard = function(obj, userData) {
  debug("Stepping into standard");

  let replyTemplate = obj.replyTemplate;
  let wildcards = obj.wildcards;
  let results = obj.results;
  let columnMap = obj.columnMap;
  let columnType = obj.columnType;
  let columnSynVector = obj.columnSynVector;
  let reName = obj.columnReName;
  //let phrasex = obj.phrasex
  let confidence = obj.confidence;

  let wordToColumn = {};
  for (let i in reName) {
    wordToColumn[reName[i]] = i;
  }
  debug(wordToColumn);
  //process.exit(0)

  debug(
    "columnMap",
    columnMap,
    "columnType",
    columnType,
    "columnSynVector",
    columnSynVector,
    "rename",
    reName
  );
  //process.exit(0)
  //Make sure these are defined
  Helper.hasProperties(obj, [
    "replyTemplate",
    "wildcards",
    "results",
    "columnMap",
    "columnType",
    "columnSynVector",
    "confidence"
  ]);

  let val = results;

  //Logger.info(val)
  let wcList = [];
  let searchResult = [];

  let tSet = []; //new Set()

  let slotScore = 0;

  for (let id = 0; id < val.length; id++) {
    let initWc = deepcopy(wildcards);
    debug("id", id, "val.length", val.length);

    let score = val[id]._score;
    let source = val[id]._source;
    let highlight = val[id].highlight;

    //get matched column id
    let matchedInColumn = [];
    for (let i in highlight) {
      if (i != "message") {
        matchedInColumn.push(i);
      }
    }

    //take the first match and use that
    let leadingMatch = Helper.getLeadingElements(matchedInColumn[0]);

    let tClass = replyTemplate.implies.join(",");

    debug("wildcards", wildcards, "tClass", tClass);
    Logger.debug("wildcards", wildcards, "tClass", tClass);

    //Column id is the actual column name
    let columnId;
    if (wildcards.column) {
      columnId = columnMap.get(wildcards.column.toLowerCase());
      columnId = wordToColumn[columnId];
    } else {
      columnId = columnType.get(tClass);
    }

    initWc.column = reName[columnId];
    Logger.debug("columnId", columnId);
    /**
     * We have to do some magic hear because sometimes the elements are not at the base level.
     * For example in a typical db the rows are {a:,b:,c:} but in some databases the rows are
     * in {r:{a:,b:,c:}} which screws up the assignment of wildcard values.
     */

    debug(
      "leadingMatch",
      leadingMatch,
      "columnId",
      columnId,
      "final",
      Helper.computeElement(leadingMatch, columnId)
    );

    //Fill in the value
    initWc.value = Helper.getObjElement(
      source,
      Helper.computeElement(leadingMatch, columnId)
    );

    //Find the name of the matched column
    let columnMatch = reName[Helper.getLastElement(matchedInColumn[0])];

    //get the value of the matched column and assign to initWc
    initWc[columnMatch] = Helper.getObjElement(source, matchedInColumn[0]);

    debug("last column!", Helper.getLastElement(matchedInColumn[0]));
    debug("wildcards", initWc, "column name", columnId);
    Logger.debug("wildcards", initWc, "column name", columnId);

    wcList.push(initWc);
    searchResult.push(source);

    if (id == 0) {
      //The first result can include 'Yes we have....''
      debug("VALS", replyTemplate.phrase, initWc);
      let slot = slotFiller.reconstructPhrase(replyTemplate.phrase, initWc);
      slotScore = slot.score;
      let fill = slot.phrase;

      if (fill) {
        tSet.push(fill);
      }
    } else {
      //Use continuation if there is more than one result
      let slot = slotFiller.reconstructPhrase(
        replyTemplate.continue[0],
        initWc
      );

      slotScore = slot.score;
      let fill = slot.phrase;
      if (fill) {
        tSet.push(fill);
      }
    }
  }

  debug("finalArray", tSet);

  let finalArray = [...tSet];
  let complete = finalArray.join("\n");
  let success = true;

  if (
    (complete == "" || complete.match(/undefined/i)) &&
    replyTemplate.negative[0]
  ) {
    //console.log('yo')
    let tAns = slotFiller.reconstructPhrase(
      replyTemplate.negative[0],
      wildcards
    );
    slotScore = 1;
    //console.log('tAns',tAns)
    if (tAns.success) {
      complete = tAns.phrase;
    } else {
      complete = "";
    }
    success = false;
  }

  let finalAns = {
    response: complete,
    wildcards: wcList,
    phrase: replyTemplate,
    success: success,
    confidence: confidence,
    searchResult: searchResult,
    slotScore: slotScore
  };

  return finalAns;
};

let negative = function(obj, userData) {
  let replyTemplate = obj.replyTemplate;
  let wildcards = obj.wildcards;
  let results = obj.results;
  let columnMap = obj.columnMap;
  let columnType = obj.columnType;
  let columnSynVector = obj.columnSynVector;
  let reName = obj.columnReName;
  //let phrasex = obj.phrasex
  let confidence = obj.confidence;

  let complete = "";

  let slotScore = 0;

  debug("replyTemplate", replyTemplate);

  if (replyTemplate.negative) {
    let tAns = slotFiller.reconstructPhrase(
      replyTemplate.negative[0],
      wildcards
    );
    slotScore = 1;
    debug("tAns", tAns);
    if (tAns.success) {
      complete = tAns.phrase;
    }
  }
  debug("complete", complete);

  let finalAns = {
    response: complete,
    wildcards: [wildcards],
    phrase: replyTemplate,
    success: false,
    confidence: confidence,
    slotScore: slotScore
  };

  debug("returning", finalAns);

  return finalAns;
};

module.exports.standard = standard;
module.exports.none = none;
module.exports.fromStorage = fromStorage;
module.exports.databaseContents = databaseContents;
module.exports.negative = negative;
