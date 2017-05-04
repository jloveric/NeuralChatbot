"use strict";


let sw = require('stopwords').english;

class PhraseTemplatesFromText {
    constructor() {
        this.wordArray;
        this.sentence;
        this.sentenceToken = [];

        //build stopwords dictionary
        this.stopwords = {}
        for (let i = 0; i < sw.length; i++) {
            this.stopwords[sw[i]] = i + 1;
        }

        this.structureSet = new Set();
    }

    isStopword(word) {
        if (this.stopwords[word]) {
            return true;
        }
        return false;
    }

    stopwordIndex(word) {
        let a = this.stopwords[word];
        if (a >= 0) {
            return a;
        }

        return -1;
    }

    parseSentences(file) {
        this.file = file;

        let wordSet = new Set()
        let fs = require('fs');
        let text = fs.readFileSync(file, 'utf8')

        let result = text.toLowerCase().replace(/(\r\n|\n|\r|")/gm, " ").replace(/,/gm, " ").replace(/--/gm, " ").replace(/(\'|\(|\|\\{|\}|\`|\))/gm, "").match(/[^\.!\?]+[\.!\?]+/g);

        for (let i = 0; i < result.length; i++) {
            result[i] = result[i].replace(/(\.|!|\?|\:|\;|{)/gm, " ")
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

        //console.log(this.sentenceToken)
    }

    computeStructure() {
        //Split the sentences into stop-words and non stop words
        this.sentenceStructure = []
        for (let i = 0; i < this.sentenceToken.length; i++) {
            this.sentenceStructure.push([])
            let newSet = { stopword: [], wildcard: [] }
            //let phraseId = [];
            for (let j = 0; j < this.sentenceToken[i].length; j++) {
                let tsw = this.isStopword(this.sentenceToken[i][j])

                //phraseId.push(tsw)
                if (tsw) {
                    newSet.stopword.push(this.sentenceToken[i][j])

                    newSet.wildcard.push([])
                } else {
                    newSet.stopword.push([])
                    newSet.wildcard.push(this.sentenceToken[i][j])
                }

            }
            newSet.phraseId = newSet.stopword.toString().replace(/(,)+/g, ',,'); //phraseId.toString();
            this.sentenceStructure[i].stopword = newSet.stopword;
            this.sentenceStructure[i].wildcard = newSet.wildcard;
            this.sentenceStructure[i].phraseId = newSet.phraseId;
            this.structureSet.add(newSet.phraseId)
        }

        //console.log(this.sentenceStructure)

    }

    computeSubSet(maxLength) {
        let reducedStructure = []
        let reducedSet = new Set()
        console.log(this.sentenceStructure.length)
        for (let i = 0; i < this.sentenceStructure.length; i++) {
            if (this.sentenceStructure[i].stopword.length < maxLength) {
                let res = this.sentenceStructure[i];
                reducedStructure.push(res);
                reducedSet.add(res.phraseId)
            }
        }

        return { data: reducedStructure, set: reducedSet }
    }

    writeData() {
        fs.writeFile(this.file + ".sentenceStructure", JSON.stringify(this.sentenceStructure), function (err) {
        });
    }
}

module.exports = PhraseTemplatesFromText;