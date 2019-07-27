"use strict";

let PhraseSequence = require("sb/phrasex/PhraseSequence.js");

class SwitchBotPhraseSequence extends PhraseSequence {
  constructor() {
    super();
  }

  initialize() {
    this.addToSequence({ user: "human", phraseGroup: "greeting" });
    this.addToSequence({ user: "bot", phraseGroup: "ask switch bot" });
    this.addToSequence({ user: "human", phraseGroup: "affirmation" });
  }
}
