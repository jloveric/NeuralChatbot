'use strict'

let fs = require('fs')

class ParseText {
  constructor() {
    this.wordArray
    this.sentence
    this.sentenceToken = []
  }

  initialize(file) {
    this.file = file

    let wordSet = new Set()
    let text = fs.readFileSync(file, 'utf8')

    let result = text
      .toLowerCase()
      .replace(/(\r\n|\n|\r|")/gm, ' ')
      .replace(/,/gm, ' ')
      .replace(/--/gm, ' ')
      .replace(/(\'|\(|\|\\{|\}|\`|\))/gm, '')
      .match(/[^\.!\?]+[\.!\?]+/g)

    for (let i = 0; i < result.length; i++) {
      result[i] = result[i].replace(/(\.|!|\?|\:|\;|{)/gm, ' ')
    }

    this.sentenceToken = []

    for (let i = 0; i < result.length; i++) {
      let words = result[i].match(/\S+/gi)

      if (words) {
        this.sentenceToken.push(words)
        for (let j = 0; j < words.length; j++) {
          wordSet.add(words[j])
        }
      }
    }

    this.wordArray = [...wordSet]
    this.wordArray.sort()

    //console.log(this.wordArray.sort())
    this.sentence = result
    //console.log(this.sentence)

    this.maxSentenceLength = 0
    for (let i = 0; i < this.sentenceToken.length; i++) {
      //let temp =
      if (this.sentenceToken[i].length > this.maxSentenceLength) {
        this.maxSentenceLength = this.sentenceToken[i].length
        //console.log(this.sentence[i])
      }
    }

    //console.log(this.sentenceToken)

    console.log(
      'vocabulary size',
      this.wordArray.length,
      'sentences',
      result.length,
      'sentenceLength',
      this.maxSentenceLength
    )
  }

  computeSentenceIndex() {
    //create map
    this.map = new Map()
    for (let i = 0; i < this.wordArray.length; i++) {
      this.map.set(this.wordArray[i], i)
    }

    //loop through sentence and add corresponding word index
    this.sentenceWordIndex = []
    for (let i = 0; i < this.sentenceToken.length; i++) {
      let nextSet = []
      for (let j = 0; j < this.sentenceToken[i].length; j++) {
        nextSet.push(this.map.get(this.sentenceToken[i][j]))
      }

      this.sentenceWordIndex.push(nextSet)
    }

    //console.log(this.sentenceWordIndex)
  }

  getSentenceWordIndex() {
    return this.sentenceWordIndex
  }

  getSentence() {
    return this.sentence
  }

  getSentenceTokens() {
    return this.sentenceToken
  }

  getVocabulary() {
    return this.wordArray
  }

  getMaxWordsInSentence() {
    return this.maxSentenceLength
  }

  writeData() {
    fs.writeFile(
      this.file + '.sentenceWordIndex',
      JSON.stringify(this.getSentenceWordIndex()),
      function(err) {}
    )

    fs.writeFile(
      this.file + '.sentence',
      JSON.stringify(this.getSentence()),
      function(err) {}
    )

    fs.writeFile(
      this.file + '.sentenceTokens',
      JSON.stringify(this.getSentenceTokens()),
      function(err) {}
    )

    fs.writeFile(
      this.file + '.vocabulary',
      JSON.stringify(this.getVocabulary()),
      function(err) {}
    )

    fs.writeFile(
      this.file + '.maxData',
      JSON.stringify(this.getMaxWordsInSentence()),
      function(err) {}
    )
  }
}

let pt = new ParseText()
//pt.initialize('asciiBooks/TwentyThousandLeagues.txt')
pt.initialize('asciiBooks/Aesop.txt')
//pt.initialize('asciiBooks/Ironmask.txt')
pt.computeSentenceIndex()
//console.log(pt.getSentenceWordIndex())
pt.writeData()
//console.log(pt.getSentenceWordIndex())>>>>>>> other
