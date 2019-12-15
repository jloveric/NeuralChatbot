'use strict'

let {Helper} = require('helper-clockmaker')
let deepcopy = require('clone')

//TODO: This looks like it is not needed. Investigate.
class SingleResponseIfc {
  constructor() {}

  getResult(searchText, userData, remember) {
    Helper.logAndThrow("Must override 'getResult(text)'")
  }

  initialize(confShallow) {
    return Promise.resolve()
  }
}

module.exports.SingleResponseIfc = SingleResponseIfc
