"use strict";
var SingleResponseIfc = require("./SingleResponseIfc").SingleResponseIfc;

/**
 * This is a dummy response to be used in the unit
 * tests.
 */
class DummyResponse extends SingleResponseIfc {
  constructor() {
    super();
  }

  initialize() {}

  /**
   * Get the result of the question, of course.
   */
  getResult(phrase) {
    let tp = new Promise((resolve, reject) => {
      resolve("This is the dummy response");
    });

    return tp;
  }
}

module.exports = DummyResponse;
