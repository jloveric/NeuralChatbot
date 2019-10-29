'use strict'

let PhraseTemplatesFromText = require('sb/phrasedive/PhraseTemplatesFromText.js')

describe('Test PhraseTemplatesFromText functions', function() {
  it('Should Return Good values', function(done) {
    let pt = new PhraseTemplatesFromText()
    //pt.initialize('asciiBooks/TwentyThousandLeagues.txt')
    pt.parseSentences(__dirname + '/Aesop.txt')
    //pt.parseSentences(__dirname+'/word.txt')
    //pt.parseSentences(__dirname+'/Ironmask.txt')
    pt.computeStructure()

    let ans = pt.computeSubSet(6)

    for (let i = 0; i < ans.data.length; i++) {
      console.log(ans.data[i].stopword)
      console.log(ans.data[i].wildcard)
    }
    console.log(
      'num sentences',
      ans.data.length,
      'structure set size',
      ans.set.size,
      'ratio',
      ans.set.size / ans.data.length
    )

    done()
  }, 10000)
})
