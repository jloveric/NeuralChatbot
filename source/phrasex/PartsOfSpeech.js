"use strict";
//Eric Brill's transformational algorithm. Transformation rules are specified in external files.

let debug = require("debug")("PartsOfSpeech");
let natural = require("natural");
let path = require("path");

class PartsOfSpeech {
  constructor() {
    let guess = path.dirname(require.resolve("natural"));
    let baseDir = guess + "/";

    let baseFolder = baseDir + "brill_pos_tagger/";
    let rulesFilename = baseFolder + "data/English/tr_from_posjs.txt";
    let lexiconFilename = baseFolder + "data/English/lexicon_from_posjs.json";
    let defaultCategory = "N";

    debug("guess", guess, "baseDir", baseDir);

    this.tokenizer = new natural.WordTokenizer();
    //console.log(tokenizer.tokenize("your dog has fleas."));

    let lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
    let rules = new natural.RuleSet(rulesFilename);
    this.tagger = new natural.BrillPOSTagger(lexicon, rules);
  }

  getPartsOfSpeech(sentence) {
    let tokens = this.tokenizer.tokenize(sentence);
    return this.tagger.tag(tokens);
  }

  getNounScore(a) {
    let length = a.length;
    let nounCount = 0;
    for (let i = 0; i < a.length; i++) {
      //JJ is an adjective
      if (
        a[i][1] == "NN" ||
        a[i][1] == "N" ||
        a[i][1] == "JJ" ||
        a[i][1] == "NNP"
      ) {
        nounCount++;
      }
    }
    return nounCount / length;
  }
}

module.exports = PartsOfSpeech;
