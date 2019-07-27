"use strict";

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = "ca-500.csv";
let PhrasexBot = require("sb/response/PhrasexBotLib.js").StandardPhrasexBot;
let UserData = require("sb/user/UserData.js");

describe("The PhrasexBotSpec With ca-500.csv", function() {
  it("Should Return Good values", function(done) {
    let conf = {
      fileDatabase: "filesystem",
      user: "ninfcs@gmail.com",
      filename: path,
      config: {
        primary: ["first_name", "last_name"]
      }
    };
    let bot = new PhrasexBot();
    bot.initialize(conf).then(() => {
      let pList = [];

      pList.push(simpleTest(bot, "Where is Danilo", "Danilo"));
      pList.push(
        simpleTest(bot, "What is danilos email", "danilo_pride@hotmail.com")
      );

      //Second case with the ? as it may not recognize the keyword
      pList.push(
        simpleTest(bot, "What is danilos email?", "danilo_pride@hotmail.com")
      );
      pList.push(simpleTest(bot, "What is danilos address"));
      pList.push(
        simpleTest(bot, "What is danilos Email?", "danilo_pride@hotmail.com")
      );

      Promise.all(pList).then(() => {
        bot.close();
        done();
      });
    });
  }, 10000);
});

var simpleTest = function(bot, phrase, keyword) {
  let userData = new UserData();
  userData.initialize();

  let p = new Promise((resolve, reject) => {
    bot.getResult(phrase, userData).then(
      function(ans) {
        let result = ans.response;
        console.log("phrase:", phrase);
        console.log("result:", result);

        let foundUndefined = result.match(/undefined/i);

        expect(result != "").toBeTruthy();
        expect(!foundUndefined).toBeTruthy();
        console.log("foundUndefined", foundUndefined);
        console.log("");

        if (keyword) {
          let tIndex = result.indexOf(keyword);
          expect(tIndex != -1).toBeTruthy();
        }

        resolve();
      },
      function(reason) {
        expect(false).toBeTruthy();
        resolve();
      }
    );
  });

  return p;
};
