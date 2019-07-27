"use strict";

let PhraseFrequency = require("sb/phrasex/PhraseFrequency.js");

describe("helper", function() {
  it("Should test PhraseFrequency for a single phrase", function() {
    let pf = new PhraseFrequency();
    pf.initialize(3);

    let phrase1 = { phrase: "First phrase", meta: { groupIndex: 1 } };

    pf.addPhrase(phrase1, 1);
    pf.addPhrase(phrase1, 1);
    pf.addPhrase(phrase1, 1);
    pf.addPhrase(phrase1, 1);

    expect(pf.deque.length).toEqual(3);
    let t = pf.phraseFrequency;
    console.log(t.get(1));
    expect(t.get(1)[0].get(1)).toEqual(1);

    pf.archiveRemaining();
    expect(t.get(1)[0].get(1)).toEqual(3);
    expect(t.get(1)[1].get(1)).toEqual(2);
    expect(t.get(1)[2].get(1)).toEqual(1);
    console.log(pf.phraseFrequency);
  });

  it("Should test PhraseFrequency for 3 phrases", function() {
    let pf = new PhraseFrequency();
    setup(pf);

    let p1 = pf.phraseFrequency.get(1);
    let p2 = pf.phraseFrequency.get(2);
    let p3 = pf.phraseFrequency.get(3);

    expect(p1[0].get(2)).toEqual(1);
    expect(p1[1].get(3)).toEqual(1);
    expect(p1[2].get(2)).toEqual(1);

    expect(p2[0].get(3)).toEqual(2);
    expect(p2[0].get(2)).toEqual(2);
    expect(p2[1].get(3)).toEqual(2);
    expect(p2[1].get(2)).toEqual(2);
    expect(p2[2].get(3)).toEqual(3);
    expect(p2[2].get(2)).toEqual(1);

    expect(p3[0].get(3)).toEqual(2);
    expect(p3[0].get(2)).toEqual(1);
    expect(p3[1].get(3)).toEqual(1);
    expect(p3[1].get(2)).toEqual(1);
    expect(p3[2].get(2)).toEqual(1);

    let ab = pf.absoluteFrequency;
    expect(ab.get(1)).toEqual(1);
    expect(ab.get(2)).toEqual(4);
    expect(ab.get(3)).toEqual(4);

    expect(pf.numEntries).toEqual(9);

    let es1 = pf.numEntriesPerStage.get(1);
    let es2 = pf.numEntriesPerStage.get(2);
    let es3 = pf.numEntriesPerStage.get(3);

    expect(es1[0]).toEqual(1);
    expect(es1[1]).toEqual(1);
    expect(es1[2]).toEqual(1);

    expect(es2[0]).toEqual(4);
    expect(es2[1]).toEqual(4);
    expect(es2[2]).toEqual(4);

    expect(es3[0]).toEqual(3);
    expect(es3[1]).toEqual(2);
    expect(es3[2]).toEqual(1);

    console.log("sorted stuff", pf.sortArchive());

    console.log("entries per stage", pf.numEntriesPerStage);
    console.log("abs frequency", pf.absoluteFrequency);
    console.log(pf.phraseFrequency);
  });

  it("Should return probabilities", function() {
    let pf = new PhraseFrequency();
    pf.initialize(3);

    setup(pf);

    pf.archiveRemaining();

    let p1 = pf.getProbability(1);
    expect(p1).toBe(1.0 / 9.0);

    let p2 = pf.getProbability(2);
    expect(p2).toBe(4.0 / 9.0);

    let p3 = pf.getProbability(3);
    expect(p3).toBe(4.0 / 9.0);

    let p4 = pf.getProbability(4);
    expect(p4).toBe(0);

    console.log("absolute probabilities", p1, p2, p3, p4);

    let p122 = pf.getConditionalProbability(1, 2, 2);
    expect(p122).toBe(0);

    let p210 = pf.getConditionalProbability(2, 1, 0);
    expect(p210).toBe(1);

    let p230 = pf.getConditionalProbability(2, 3, 0);
    expect(p230).toBe(1 / 3);

    let p231 = pf.getConditionalProbability(2, 3, 1);
    expect(p231).toBe(1 / 2);

    console.log("conditional probabilities", p122, p210, p230, p231);
  });

  it("Just make sure it can add a real object", function() {
    let pf = new PhraseFrequency();
    pf.initialize(3);

    let obj = {
      response: "Yes, we have Cottage Cheese",
      wildcards: [{ matched: true, item: "Cottage Cheese", value: undefined }],
      phrase: {
        _id: 57,
        phraseType: "tell",
        implies: ["existence"],
        target: ["item"],
        meta: { group: "existence", groupIndex: 42 },
        negative: ["We don't have (item)"],
        phrase: "Yes, we have (item)",
        continue: ["(item)"],
        words: "Yes, we have"
      },
      success: true,
      confidence: 0.6666666666666666
    };

    pf.addPhrase(obj.phrase);
  });

  it("Should test PhraseFrequency with finite confidence", function() {
    let pf = new PhraseFrequency();
    pf.initialize(3);

    let phrase1 = { phrase: "First phrase", meta: { groupIndex: 1 } };
    let phrase2 = { phrase: "First phrase", meta: { groupIndex: 2 } };

    pf.addPhrase(phrase1, 0.5);
    pf.addPhrase(phrase1, 0.25);
    pf.addPhrase(phrase1, 0.1);
    pf.addPhrase(phrase1, 0.75);
    pf.addPhrase(phrase2, 0.75);
    pf.addPhrase(phrase2, 0.5);

    let t = pf.phraseFrequency;

    pf.archiveRemaining();
    expect(t.get(1)[0].get(1)).toEqual(1.1);
    expect(t.get(1)[1].get(1)).toEqual(0.85);
    expect(t.get(1)[2].get(1)).toEqual(0.75);
    console.log(pf.phraseFrequency);

    let p1 = pf.getProbability(1);
    expect(p1).toBe(0.5614035087719298);

    let p2 = pf.getProbability(2);
    expect(p2).toBe(0.43859649122807015);

    let p120 = pf.getConditionalProbability(1, 2, 0);
    expect(p120).toBe(0);

    let p210 = pf.getConditionalProbability(2, 1, 0);
    expect(p210).toBe(0.4054054054054054);

    let p211 = pf.getConditionalProbability(2, 1, 1);
    expect(p211).toBe(0.5952380952380952);
  });
});

var setup = function(pf) {
  pf.initialize(3);

  let phrase1 = { phrase: "First phrase", meta: { groupIndex: 1 } };
  let phrase2 = { phrase: "Second phrase", meta: { groupIndex: 2 } };
  let phrase3 = { phrase: "Third phrase", meta: { groupIndex: 3 } };

  pf.addPhrase(phrase1, 1);
  pf.addPhrase(phrase2, 1);
  pf.addPhrase(phrase3, 1);
  pf.addPhrase(phrase2, 1);
  pf.addPhrase(phrase2, 1);
  pf.addPhrase(phrase2, 1);
  pf.addPhrase(phrase3, 1);
  pf.addPhrase(phrase3, 1);
  pf.addPhrase(phrase3, 1);

  pf.archiveRemaining();
};
