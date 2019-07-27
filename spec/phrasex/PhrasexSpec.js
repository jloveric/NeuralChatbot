"use strict";

let Phrasex = require("sb/phrasex/Phrasex.js");
let slotFiller = require("sb/phrasex/SlotFiller.js");
let UserData = require("sb/user/UserData.js");

describe("Testing Phrasex", function() {
  it("Should make guesses with ambiguous data", function(done) {
    let phrasex = new Phrasex();

    let pList = [];

    pList.push(
      simpleTest(phrasex, "the tacos are in aisle 2", {
        item: "tacos",
        column: "aisle",
        value: "2"
      })
    );

    Promise.all(pList).then(values => {
      done();
    });
  }, 10000);

  it("This should produce the correct wildcards", function(done) {
    let phrasex = new Phrasex();

    let pList = [];

    pList.push(
      simpleTest(
        phrasex,
        "muc duz taco salad cot",
        { item: "taco salad" },
        "How much does the taco salad cost"
      )
    );
    pList.push(
      simpleTest(
        phrasex,
        "What is the true color of the banana",
        { item: "banana" },
        "What is the true color of the banana"
      )
    );
    pList.push(
      simpleTest(
        phrasex,
        "What is true color of banana",
        { column: "true color", item: "banana" },
        "What is true color of banana"
      )
    );
    pList.push(
      simpleTest(
        phrasex,
        "What is John Loverich email",
        { item: "John Loverich", column: "email" },
        null,
        ["mail", "address", "email"]
      )
    );

    //Show that we can get an answer when there are more wildcards than
    //holes to fill.  The result is wrong, but it is the best you can do
    //when no keyword is matched and it is better than crashing.
    pList.push(
      simpleTest(
        phrasex,
        "What is John Loverich email",
        { item: "John" },
        null,
        ["mail", "address", "tmail"],
        true
      )
    );

    //With non alphanumeric character in keywords (?).
    pList.push(
      simpleTest(
        phrasex,
        "What is John Loverich email?",
        { item: "John Loverich", column: "email" },
        null,
        ["mail", "address", "email"],
        true
      )
    );

    //check for case sensitivity on the column value.

    pList.push(
      simpleTest(
        phrasex,
        "What is John Loverich Email?",
        { item: "John Loverich", column: "Email" },
        null,
        ["mail", "address", "email"],
        true
      )
    );
    pList.push(
      simpleTest(
        phrasex,
        "What aisle is that taco salad located",
        { item: "taco salad", column: "aisle" },
        "What aisle is that taco salad located"
      )
    );
    pList.push(
      simpleTest(
        phrasex,
        "What aisle is that located",
        { item: null, column: "aisle" },
        null,
        "What (column) is that (item) located"
      )
    );

    pList.push(
      simpleTest(
        phrasex,
        "What is my name",
        { column: "name" },
        null,
        "What is my (column)"
      )
    );

    //Show that we get the correct reconstruction
    pList.push(
      new Promise((resolve, reject) => {
        let res = slotFiller.reconstructPhrase("The (item) is in (column)", {
          item: "tomato",
          column: "aisle 2"
        });
        expect(res.phrase).toEqual("The tomato is in aisle 2");
        expect(res.success).toEqual(true);
        resolve();
      })
    );

    Promise.all(pList).then(values => {
      done();
    });
  }, 10000);

  it("Should produce reasonable scores", function(done) {
    let phrasex = new Phrasex();

    let pList = [];

    let userData = new UserData();
    phrasex
      .getWildcardsAndMatch("May I speak with hi my name is jake", [], userData)
      .then(ans => {
        console.log(ans);
        expect(ans[0].confidence).toBe(1);
        return phrasex.getWildcardsAndMatch(
          "May I speak with jake",
          [],
          userData
        );
      })
      .then(ans => {
        console.log(ans);
        expect(ans[0].confidence).toBeTruthy(1);
        return phrasex.getWildcardsAndMatch(
          "I may speak with jake",
          [],
          userData
        );
      })
      .then(ans => {
        console.log(ans);
        expect(ans[0].confidence < 1).toBeTruthy();
        return phrasex.getWildcardsAndMatch("Hi my name is jake", [], userData);
      })
      .then(ans => {
        console.log(ans);
        expect(ans[0].confidence).toBe(1);
        return phrasex.getWildcardsAndMatch("my I speeek", [], userData);
      })
      .then(ans => {
        console.log("---------yo-------------", ans);
        expect(ans[0].confidence < 1.0).toBeTruthy();
        done();
      });
  }, 10000);

  it("It should be able to fill in wildcards from older data", function() {
    let userData = new UserData();
    userData.initialize(1);

    let o1 = { wildcards: { item: "pickles" } };
    let o2 = { wildcards: { name: "john" } };
    let o3 = { wildcards: { column: "store" } };
    let o4 = { wildcards: { item: "tuna" } };
    let o5 = { wildcards: { item: "fish" } };

    userData.unshiftHistory(o1);
    userData.unshiftHistory(o2);
    userData.unshiftHistory(o3);
    userData.unshiftHistory(o4);
    userData.unshiftHistory(o5);

    let phrasex = new Phrasex();

    let ans = slotFiller.getWildcardFromHistory("item", userData.history, 5);
    console.log(ans);
    expect(ans.length).toBe(3);

    expect(ans[0]).toBe("fish");
    expect(ans[1]).toBe("tuna");
    expect(ans[2]).toBe("pickles");

    ans = slotFiller.getWildcardFromHistory("column", userData.history, 3);
    expect(ans.length).toBe(1);
    expect(ans[0]).toBe("store");

    console.log(ans);
  }, 10000);
});

var simpleTest = function(
  phrasex,
  phrase,
  expectedWildcard,
  expectedReconstructedPhrase,
  keywords,
  success,
  expectedPhrase
) {
  let userData = new UserData();
  userData.initialize();

  let p = new Promise((resolve, reject) => {
    phrasex
      .find(phrase, userData)
      .then(resArray => {
        let res = resArray[0];

        console.log(phrase);
        let wcAndScore = slotFiller.computeWildcards(
          res.wcDB,
          res.wcUser,
          res.matchScore,
          keywords
        );
        let wc = wcAndScore.wildcards;
        console.log(res);
        //console.log(wc)

        for (let i in expectedWildcard) {
          expect(wc[i]).toEqual(expectedWildcard[i]);
        }

        if (expectedPhrase) {
          expect(res.source.phrase).toBe(expectedPhrase);
        }

        if (expectedReconstructedPhrase) {
          let ans = slotFiller.reconstructPhrase(res.source.phrase, wc);
          let phrase = ans.phrase;

          expect(phrase).toEqual(expectedReconstructedPhrase);
          console.log(phrase);

          if (success != null) {
            expect(success).toEqual(tSuccess);
            console.log("success", tSuccess);
          }
        }

        console.log("");
        resolve();
      })
      .catch(reason => {
        console.log("failed", reason);
        console.log(reason);
      });
  });

  return p;
};
