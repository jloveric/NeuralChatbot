'use strict'

let SearchRecord = require('sb/response/SearchRecord.js')

describe('SearchRecordSpec', function() {
  it('Does the SearchRecord work?', function(done) {
    let sr = new SearchRecord()

    let a = []
    for (let i = 0; i < 50; i++) {
      a.push(i)
    }

    sr.setRecord(a)

    let ans = sr.getNext(10)
    console.log('ans', ans)
    for (let i = 0; i < 10; i++) {
      expect(ans.result[i]).toBe(i)
    }
    expect(ans.noMore).toBe(false)

    ans = sr.getNext(10)
    console.log(ans)
    for (let i = 0; i < 10; i++) {
      expect(ans.result[i]).toBe(i + 10)
    }
    expect(ans.noMore).toBe(false)

    sr.getNext(10)
    ans = sr.getNext(10)
    expect(ans.noMore).toBe(false)
    ans = sr.getNext(10)
    console.log(ans)
    for (let i = 0; i < 10; i++) {
      expect(ans.result[i]).toBe(i + 40)
    }
    expect(ans.noMore).toBe(true)

    console.log(ans)

    done()
  })
})
