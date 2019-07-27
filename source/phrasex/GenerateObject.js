"use strict";

let Logger = require("sb/etc/Logger.js")("GenerateObject");
let Helper = require("sb/etc/Helper.js");
let deepcopy = require("clone");
let debug = require("debug")("GenerateObject");

/**
 * This is a class for generating json objects from phrasex
 * These use the objects defined in the phrase database in
 * the "storage" element.
 */

class GenerateObject {
  constructor() {
    //For storing actual data
    this.obj = {};

    //For storing additional info associated with each insertion
    this.info = {};
  }

  getObj() {
    return this.obj;
  }

  getInfo() {
    return this.info;
  }

  toLowercase(objIn) {
    let obj = deepcopy(objIn);
    for (let i in obj) {
      if (typeof obj[i] === "string") {
        obj[i] = obj[i].toLowerCase();
      }
    }
    return obj;
  }

  /**
   * Do everything
   * @param is the wildcard from phrasex
   * @param description is a string '(a).b.c' that describes
   * the storage location.
   * @param valString is the actual value to store at that location.
   * @param intent is a word describing generally what is desired.
   * Examples would be place, price etc...  the bot stores this
   * as _place =[aisle, city] so that if a place question is asked,
   * it knows to refer to tomatoes.aisle for example
   */
  insertElement(wc, description, valString, intent, info) {
    let eString = this.expandElement(wc, description);
    if (eString.complete) {
      let ans = this.setElement(wc, eString.val, valString, intent);
      if (ans && info) {
        info.val = ans;
        return Helper.setCreateElementArray(this.info, eString.val, info);
      }
    }
    debug("GenerateObject", this.getObj());
  }

  /**
   * Compute the element based on wildcard values
   * @param wc is a wildcard object containing wildcard values
   * @param description is a string possibly containg wildcard
   * {item : "somevalue", column : "aisle"}
   * place holders (item).(column).name where the terms in
   * parentheses are wildcards
   */
  expandElement(wcIn, description) {
    //let wc = wcIn
    let wc = this.toLowercase(wcIn);

    //split on . or :
    let lhs = description.replace(":", ".").split(".");

    debug("lhs", lhs);

    let actual = [];
    for (let i = 0; i < lhs.length; i++) {
      let wcColumn = lhs[i].match(Helper.betweenParentheses);
      let exactColumn = lhs[i];

      debug("wc", wc);
      debug("wcColumn", wcColumn);
      debug("exactColumn", exactColumn);

      if (wcColumn) {
        let newVal = wc[wcColumn[1]];

        debug("newVal", newVal);
        if (!newVal) {
          //this is as good as we can do so return early
          return { val: actual, complete: false };
        }
        actual.push(newVal);
      } else {
        if (!exactColumn) {
          //This is as good as we can do so return early
          return { val: actual, complete: false };
        }
        actual.push(exactColumn);
      }
    }

    debug("actual", actual);
    return { val: actual, complete: true };
  }

  completeArray(elementArray, oldIntent) {
    let ans = Helper.getObjElementArray(this.obj, elementArray);
    if (ans) {
      if (!(typeof ans === "object")) {
        debug("Returning asap from getElement");
        return { val: deepcopy(elementArray), ans: ans };
      }
    }

    let intent = "_" + oldIntent;

    //Check if the last element of elementArray is a specific intent, if
    //not, add it in so we can find what we are looking for.
    if (this.obj[intent]) {
      debug("the intent", intent, "was found");
      let lastElem = elementArray[elementArray.length - 1];
      let newArray;

      debug("lastElem", lastElem);
      let temp = this.obj[intent];
      debug("temp", temp);
      //Check to if the lastElem is a specific intent, should've worked if it was'
      if (!temp[lastElem]) {
        debug("last element not an intent", lastElem);
        //Now we are assuming there is only one key.  This is not always the case
        //and we'll need to figure out a solution when it is not the case, but
        //the user can always explicitly specify the column
        for (let i in this.obj[intent]) {
          newArray = deepcopy(elementArray);
          newArray.push(i);
          debug("newArray", newArray);

          //Yes this is supposed to return after the first iteration
          let newAns = Helper.getObjElementArray(this.obj, newArray);
          if (newAns) {
            if (!(typeof newAns === "object")) {
              return { val: newArray, ans: newAns };
            }
          }
        }
      }
    }

    //nothing worked man
    return null;
  }

  flattenedObject(path, rhs, completeArray, wcOld) {
    let wc = {};

    let lhs = path.replace(":", ".").split(".");

    if (lhs.length != completeArray.length) {
      Logger.error("Path.length must be completeArray.length");
      return false;
    }

    //match the lhs
    for (let i = 0; i < lhs.length; i++) {
      let wcColumn = lhs[i].match(Helper.betweenParentheses);
      let exactColumn = lhs[i];

      if (wcColumn) {
        wc[wcColumn[1]] = completeArray[i];
      } else {
        wc[exactColumn] = completeArray[i];
      }
    }

    let t = rhs.match(Helper.betweenParentheses);
    let tExact = rhs;

    if (t) {
      wc[t[1]] = this.getElement(completeArray);
    } else {
      wc[tExact] = this.getElement(completeArray);
    }

    for (let i in wc) {
      if (wc[i] == null) {
        return false;
      }
    }

    wcOld = Object.assign(wcOld, wc);
    return true;
  }

  /**
   * Get the value and get the info for the given elementArray
   */
  getAll(elementArray, oldIntent) {
    debug("elemArray", elementArray);
    let a = this.completeArray(elementArray, oldIntent);
    debug("getAll a", a, this.obj);
    if (a) {
      let info = Helper.getObjElementArray(this.info, a.val);
      let res = { val: a.ans, info: info };
      debug("getAll res", res);
      return res;
    }

    return null;
  }

  getElement(elementArray, oldIntent) {
    let a = this.completeArray(elementArray, oldIntent);
    if (a) {
      return a.ans;
    }

    return null;
  }

  setElement(wcIn, elementArray, valString, intent) {
    if (!elementArray) return null;

    //let wc = wcIn;
    let wc = this.toLowercase(wcIn);

    //place is an intent, aisle is a specific intent.  Add a specific
    //intent to the general intent, so the bot knows what it can look for.
    if (intent) {
      let newIntent = "_" + intent;
      let specificIntent = elementArray[elementArray.length - 1];
      if (this.obj[newIntent]) {
        this.obj[newIntent][specificIntent] = true;
      } else {
        this.obj[newIntent] = {};
        this.obj[newIntent][specificIntent] = true;
      }
    }

    let val;
    if (typeof valString == "string") {
      val = valString.match(Helper.betweenParentheses);
    }

    if (val) {
      let newVal = wc[val[1]];
      if (newVal != null) {
        return Helper.setCreateElementArray(this.obj, elementArray, newVal);
      } else {
        return null;
      }
    } else if (valString) {
      debug("valString", valString, "elementArray", elementArray);
      if (valString != null) {
        return Helper.setCreateElementArray(this.obj, elementArray, valString);
      } else {
        return null;
      }
    }

    return null;
  }
}

module.exports = GenerateObject;
