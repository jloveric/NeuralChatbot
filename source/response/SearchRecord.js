'use strict'

let deepcopy = require('clone')
let debug = require('debug')('SearchRecord')

/**
 * Stores an array and returns elements of the array
 * N values at a time.  This is used to cache search data
 * so if you search for 100 items, but only want 10 to
 * show up.  This class does it.
 */
class SearchRecord {
  constructor() {
    this.cursor = 0
    this.record = null
  }

  setCursor(val) {
    this.cursor = val
  }

  setRecord(val) {
    this.cursor = 0
    this.record = deepcopy(val)
    debug('Record.length', this.record.length)
  }

  getNext(n) {
    let ans = []
    let length = this.record.length

    for (let i = 0; i < n; i++) {
      let index = this.cursor + i
      if (index < length) {
        ans.push(this.record[index])
      }
    }

    this.cursor = this.cursor + n

    debug('cursor', this.cursor, 'length', length)

    let noMore = false
    if (this.cursor >= length) {
      noMore = true
    }

    return { result: ans, noMore: noMore }
  }
}

module.exports = SearchRecord
