'use strict'

let helper = require('sb/etc/Helper.js')
let StopWords = require('sb/etc/Stopwords')
let abbreviations = require('sb/etc/SingleLetterAbbreviations.js')

let GetConfigValues = require('sb/etc/GetConfigValues.js')
let gc = new GetConfigValues()

describe('helper', function() {
  it('Should tokenize new lines properly', function() {
    let phrase = '(ITEM)\n(BAT)\nAnd a few (ITEM)'
    let ans = phrase.match(helper.tokenize)
    expect(ans.length).toBe(6)
    expect(ans[0].match('/\\n/g')).toBeFalsy()
    console.log(ans)
  })

  it('Should convert abbreviations', function() {
    let a = ['r', '2', 'o', 'are']
    helper.expandSentence(a, abbreviations)

    expect(a[0]).toBe('are')
    expect(a[1]).toBe('to')
    expect(a[2]).toBe('oh')
    expect(a[3]).toBe('are')

    console.log(a)
  })

  it('Should find object with best value', function() {
    let a = []
    a.push({ r: 0, val: 1 })
    a.push({ r: 1, val: 1 })
    a.push({ r: 2, val: 10 })
    a.push({ r: 3, val: 5 })

    let ans = helper.objectWithBestValue(a, (t, q) => {
      return t.val < q.val
    })

    console.log(ans)
    expect(ans.r).toEqual(2)
    expect(ans.val).toEqual(10)
  })

  it('Should log and throw undefined', function() {
    let a = null
    let ans = helper.logAndThrowUndefined('Test error', a, true)
    expect(ans).toBeTruthy()

    a = 1.0
    ans = helper.logAndThrowUndefined('Test error', a, true)
    expect(ans).toBeFalsy()
  })

  it('Should log and throw', function() {
    let ans = helper.logAndThrow('Test error 2', true)
    expect(ans).toBeTruthy()
  })

  it('Should check matchesRegex', function() {
    let ans = helper.matchesRegex('Does this match', /Does/gi)
    expect(ans).toBeTruthy()

    ans = helper.matchesRegex('Does this match', /Not/gi)
    expect(ans).toBeFalsy()

    ans = helper.matchesRegex(null, /Not/i)
    expect(ans).toBeFalsy()
  })

  it('Should be using node', function() {
    let ans = helper.isUsingNode()
    expect(ans).toBeTruthy()
  })

  it('Check if hasProperties works', function() {
    let obj = { a: 'a', b: 'c' }
    let ans = helper.hasProperties(obj, ['a', 'b'])
    expect(ans).toBeTruthy()

    ans = helper.hasProperties(obj, ['a', 'b', 'c'], true)
    expect(ans).toBeFalsy()
  })

  it('Should find a stopword', function() {
    let w0 = helper.stopWordIndex('then')
    expect(StopWords[w0]).toEqual('then')
    expect(helper.isStopWord('then')).toBeTruthy()

    let w1 = helper.stopWordIndex('kaiper')
    expect(w1 < 0).toBeTruthy()
    expect(helper.isStopWord('kaiper')).toBeFalsy()
  })

  it('Should test matchHighlitedWords', function() {
    let a = helper.matchedHighlightWords(
      '<em>These</em> things <em>are</em> available'
    )
    expect(a.matchCount).toBe(2)
    expect(a.matchWords[0]).toBe('These')
    expect(a.matchWords[1]).toBe('are')
    expect(a.totalCount).toBe(4)
    expect(a.score).toBe(0.5)
  })

  it('Should return whether array has word', function() {
    expect(helper.containsRegex(['this', 'that', 'other'], /oh/i)).toBe(false)
    expect(helper.containsRegex(['this', 'that', 'other'], /that/i)).toBe(true)
  })

  it('Should return the correct element', function() {
    let item = { a: { b: { c: { d: 10 } } }, other: 5 }

    expect(helper.getObjElement(item, 'a.b.c.d')).toBe(10)
    expect(helper.getObjElement(item, 'other')).toBe(5)

    expect(helper.getLastElement('a.b.c.d')).toBe('d')
    expect(helper.getLeadingElements('a.b.c.d')).toBe('a.b.c')

    expect(helper.getLastElement('d')).toBe('d')
    expect(helper.getLeadingElements('a')).toBe('')

    expect(helper.computeElement('a.b.c', 'd')).toBe('a.b.c.d')
    expect(helper.computeElement('', 'd')).toBe('d')

    expect(helper.computeElement('', null)).toBe('')
  })

  it('Should show if element exists', function() {
    let item = {
      a: { b: { c: { d: 10 } } },
      other: 5,
      g: { e: { f: 20 } },
      k: ['What the heck', 'is', 'this all about'],
    }

    let ans = helper.findProperty(item, 'd')
    console.log(ans)
    expect(JSON.stringify(ans)).toBe(JSON.stringify(['a', 'b', 'c', 'd']))
    expect(helper.getObjElementArray(item, ans)).toBe(10)

    ans = helper.findProperty(item, 'h')
    console.log(ans)
    expect(ans.length).toBe(0)

    ans = helper.findProperty(item, 'e')
    console.log(ans)
    expect(JSON.stringify(ans)).toBe(JSON.stringify(['g', 'e']))

    let source = {
      user: 'root',
      description: {
        name: gc.bot.rootName,
        nickname: 'clockmaker',
        purpose: 'This bot controls all other bots',
        keywords: 'chief,main,super,root,god',
        business: 'N Infinity Computational Sciences',
        city: 'Lafayette',
        state: 'Colorado',
        county: 'Boulder',
        country: 'United States',
      },
    }

    let res = helper.findProperty(source, 'name')
    expect(JSON.stringify(res)).toBe(JSON.stringify(['description', 'name']))
  })

  it('Should return the highlighted fields', function() {
    let highlight = { item: 'this', message: 'that', other: 'thing' }
    let ans = helper.highlightedFields(highlight)
    expect(ans[0]).toEqual('item')
    expect(ans[1]).toEqual('other')
    expect(ans.length).toEqual(2)
  })

  it('Should clean an array of punctuation and case', function() {
    let a = ['This', 'shoulD', 'Not!', 'be?']
    a = helper.cleanArray(a)

    expect(a[0]).toEqual('this')
    expect(a[1]).toEqual('should')
    expect(a[2]).toEqual('not')
    expect(a[3]).toEqual('be')

    a = helper.cleanArray(['tuna'])
    expect(a[0]).toEqual('tuna')
  })
})
