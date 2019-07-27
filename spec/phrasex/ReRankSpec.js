"use strict";

let frequencyRank = require("sb/phrasex/ReRank.js").frequencyRank;
let PhraseFrequency = require("sb/phrasex/PhraseFrequency.js");
let reRank = require("sb/phrasex/ReRank.js").reRank;
let alignmentRank = require("sb/phrasex/ReRank.js").alignmentRank;
let combineRank = require("sb/phrasex/ReRank.js").combineRank;
let boostSort = require("sb/phrasex/ReRank.js").boostSort;

let hits = {
  total: 26,
  max_score: 2.6238284,
  hits: [
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "11",
      _score: 2.6238284,
      _source: {
        phrase: "Do you have any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have any"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em> any"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "14",
      _score: 2.6238284,
      _source: {
        phrase: "Do you have (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em>"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "77",
      _score: 2.6238284,
      _source: {
        phrase: "What (item) do you have",
        phraseType: "query",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        words: "What do you have"
      },
      highlight: { words: ["What <em>do</em> <em>you</em> <em>have</em>"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "87",
      _score: 2.6238284,
      _source: {
        phrase: "What do you have?",
        phraseType: "query",
        implies: ["item"],
        target: [],
        meta: { style: ["noInfo"], group: "show item", groupIndex: 20 },
        words: "What do you have?"
      },
      highlight: { words: ["What <em>do</em> <em>you</em> <em>have</em>?"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "76",
      _score: 1.9678714,
      _source: {
        phrase: "What kind of (item) do you have",
        phraseType: "query",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        words: "What kind of do you have"
      },
      highlight: {
        words: ["What kind of <em>do</em> <em>you</em> <em>have</em>"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "12",
      _score: 1.0650656,
      _source: {
        phrase: "Do you sell any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you sell any"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> sell any"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "15",
      _score: 1.0650656,
      _source: {
        phrase: "Do you sell (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you sell"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> sell"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "73",
      _score: 0.665666,
      _source: {
        phraseType: "tell",
        implies: ["person"],
        target: ["name"],
        meta: { group: "request bot", groupIndex: 12 },
        negative: ["I don't know any (name)"],
        phrase: "You have chosen to speak with (name). Good luck!",
        continue: ["You have chosen to speak with (name). Good luck!"],
        words: "You have chosen to speak with . Good luck!"
      },
      highlight: {
        words: ["<em>You</em> <em>have</em> chosen to speak with . Good luck!"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "109",
      _score: 0.665666,
      _source: {
        phraseType: "tell",
        implies: ["greeting"],
        target: ["name"],
        meta: { style: ["nosearch"], group: "greeting", groupIndex: 0 },
        phrase: "Hi my friend, what can I do for you?",
        continue: ["Hi my friend, what can I do for you?"],
        words: "Hi my friend, what can I do for you?"
      },
      highlight: {
        words: ["Hi my friend, what can I <em>do</em> for <em>you</em>?"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "78",
      _score: 0.42759585,
      _source: {
        phraseType: "tell",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        negative: ["We don't have (item)"],
        phrase: "We have (value)",
        continue: ["(value)"],
        words: "We have"
      },
      highlight: { words: ["We <em>have</em>"] }
    }
  ]
};

let hits2 = {
  total: 26,
  max_score: 2.6238284,
  hits: [
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "11",
      _score: 2.6238284,
      _source: {
        phrase: "Do you have any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have any"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em> any"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "14",
      _score: 2.6238284,
      _source: {
        phrase: "any time",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em>"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "14",
      _score: 2.6238284,
      _source: {
        phrase: "any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em>"] }
    }
  ]
};

let hits3 = {
  total: 26,
  max_score: 2.6238284,
  hits: [
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "11",
      _score: 2.6238284,
      _source: {
        phrase: "Do you have any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have any"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em> any"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "14",
      _score: 2.6238284,
      _source: {
        phrase: "Do you have (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you have"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> <em>have</em>"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "77",
      _score: 2.6238284,
      _source: {
        phrase: "What (item) do you have",
        phraseType: "query",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        words: "What do you have"
      },
      highlight: { words: ["What <em>do</em> <em>you</em> <em>have</em>"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "87",
      _score: 2.6238284,
      _source: {
        phrase: "What do you have?",
        phraseType: "query",
        implies: ["item"],
        target: [],
        meta: { style: ["noInfo"], group: "show item", groupIndex: 20 },
        words: "What do you have?"
      },
      highlight: { words: ["What <em>do</em> <em>you</em> <em>have</em>?"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "76",
      _score: 1.9678714,
      _source: {
        phrase: "What kind of (item) do you have",
        phraseType: "query",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        words: "What kind of do you have"
      },
      highlight: {
        words: ["What kind of <em>do</em> <em>you</em> <em>have</em>"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "12",
      _score: 1.0650656,
      _source: {
        phrase: "Do you sell any (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you sell any"
      },
      highlight: { words: ["<em>Do</em> <em>you</em> sell any"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "15",
      _score: 1.0650656,
      _source: {
        phrase: "Do you sell (item)",
        phraseType: "query",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        words: "Do you sell",
        boostRank: 1
      },
      highlight: { words: ["<em>Do</em> <em>you</em> sell"] }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "73",
      _score: 0.665666,
      _source: {
        phraseType: "tell",
        implies: ["person"],
        target: ["name"],
        meta: { group: "request bot", groupIndex: 12 },
        negative: ["I don't know any (name)"],
        phrase: "You have chosen to speak with (name). Good luck!",
        continue: ["You have chosen to speak with (name). Good luck!"],
        words: "You have chosen to speak with . Good luck!"
      },
      highlight: {
        words: ["<em>You</em> <em>have</em> chosen to speak with . Good luck!"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "109",
      _score: 0.665666,
      _source: {
        phraseType: "tell",
        implies: ["greeting"],
        target: ["name"],
        meta: { style: ["nosearch"], group: "greeting", groupIndex: 0 },
        phrase: "Hi my friend, what can I do for you?",
        continue: ["Hi my friend, what can I do for you?"],
        words: "Hi my friend, what can I do for you?"
      },
      highlight: {
        words: ["Hi my friend, what can I <em>do</em> for <em>you</em>?"]
      }
    },
    {
      _index: "phrasedb",
      _type: "pub",
      _id: "78",
      _score: 0.42759585,
      _source: {
        phraseType: "tell",
        implies: ["item"],
        target: ["item"],
        meta: { group: "kind", groupIndex: 14 },
        negative: ["We don't have (item)"],
        phrase: "We have (value)",
        continue: ["(value)"],
        words: "We have",
        boostRank: 1
      },
      highlight: { words: ["We <em>have</em>"] }
    }
  ]
};

describe("helper", function() {
  it("Should reRank results properly", function() {
    let pf = new PhraseFrequency();
    pf.initialize(4);

    let th0 = hits.hits[0]._source;
    let th1 = hits.hits[1]._source;
    let th2 = hits.hits[2]._source;
    let th3 = hits.hits[3]._source;

    //First build up some statistics
    for (let i = 0; i < 4; i++) {
      //These two are the same groupIndex
      pf.addPhrase(th0);
      pf.addPhrase(th1);

      pf.addPhrase(th2);
      pf.addPhrase(th2);
      pf.addPhrase(th2);

      pf.addPhrase(th3);
    }

    pf.archiveRemaining();

    let phrase = "have";

    let alignment = alignmentRank(hits.hits, phrase);
    console.log("alignment", alignment);

    let frequency = frequencyRank(hits.hits, pf);
    console.log("frequencyRank", frequency);

    let ansAvg = combineRank(hits.hits, phrase, pf);
    console.log("avg", ansAvg);

    let ans1 = reRank(hits.hits, phrase, pf);
    console.log("reRank", ans1);

    //let ans2 = reRank(hits.hits, "have wine", pf)
    //console.log('reRank', ans2)
    //expect(ans._source.words).toBe('Do you have any')
  });

  it("Should reRank results properly 2", function() {
    let pf = new PhraseFrequency();
    pf.initialize(4);

    let alignment = alignmentRank(hits2.hits, "any fish");
    console.log("alignment", alignment);
  });

  it("Should rank the boosted terms properly", function() {
    let boost = boostSort(hits3.hits);
    expect(boost[0]._source.boostRank).toEqual(1);
    expect(boost[1]._source.boostRank).toEqual(1);
    expect(boost[2]._source.boostRank).toBeFalsy();
    console.log("alignment", boost);
  });
});
