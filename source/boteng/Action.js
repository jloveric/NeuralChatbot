'use strict'

let {Helper} = require('helper-clockmaker')

class Action {
  constructor() {}

  getName() {
    return this.name
  }

  initialize(input) {
    Helper.hasProperties(input, [
      'search',
      'columnMap',
      'columnType',
      'columnSynVector',
      'columnReName',
      'primary',
    ])

    this.columnMap = input.columnMap
    this.columnType = input.columnType
    this.columnSynVector = input.columnSynVector
    this.columnReName = input.columnReName
    this.search = input.search
    this.primary = input.primary
  }

  /**
   * Filter takes an input and returns true
   * or false as to whether the filter passes.
   */
  filterInput(input) {}

  /**
   * Compute the input given this filter
   * @param input is an object containing all sorts of input data
   * @param userData is a UserData object storing histories and memory etc...
   */
  computeResult(input, userData) {}
}

module.exports = Action
