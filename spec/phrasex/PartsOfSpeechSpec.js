"use strict";

let PartsOfSpeech = require("sb/phrasex/PartsOfSpeech.js");

describe("PartsOfSpeech Class", function() {
  it("Should tag the parts of speech", function() {
    let pos = new PartsOfSpeech();

    let phrase = "do you have any cat food";

    let ans = pos.getPartsOfSpeech(phrase);
    let nounScore = pos.getNounScore(ans);
    expect(nounScore).toBe(1.0 / 3.0);
    console.log("ans", ans, nounScore);

    phrase = "cat food";
    ans = pos.getPartsOfSpeech(phrase);
    nounScore = pos.getNounScore(ans);
    expect(nounScore).toBe(1.0);
    console.log(ans, nounScore);

    ans = pos.getPartsOfSpeech("cat and dog");
    nounScore = pos.getNounScore(ans);
    expect(nounScore).toBe(2.0 / 3.0);
    console.log(ans, nounScore);

    ans = pos.getPartsOfSpeech("he is somebody important");
    nounScore = pos.getNounScore(ans, nounScore);
    expect(nounScore).toBe(0.5);
    console.log(ans, nounScore);

    ans = pos.getPartsOfSpeech(
      "They refuse to permit us to obtain the refuse permit"
    );
    console.log(ans);
  });
});
