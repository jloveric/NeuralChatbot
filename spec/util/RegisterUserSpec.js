"use strict";

let spawn = require("child_process").spawn;
let exec = require("child_process").exec;

describe("Testing the utility CreateBot", function() {
  it("Should create a new bot", function(done) {
    let np = new Promise((resolve, reject) => {
      exec(
        "source/util/RegisterUser.js --username random --password tunafish",
        (error, stdout, stderr) => {
          if (error) {
            expect(false).toEqual(true);
          }

          if (stdout) {
            console.log("stdout", stdout);
          }

          if (stderr) {
            console.log("stderr", stderr);
            //expect(false).toBe(true)
          }

          resolve();
        }
      );
    });

    np.then(() => {
      done();
    });
  }, 50000);

  it("Now you should delete the whole thing", function(done) {
    //Missing a variable

    exec(
      "source/util/DeleteUser.js --username random",
      (error, stdout, stderr) => {
        if (error) {
          console.log("error", error);
          expect(false).toEqual(true);
        }

        if (stdout) {
          console.log("stdout", stdout);
        }

        if (stderr) {
          console.log("stderr", stderr);
        }
        done();
      }
    );
  }, 50000);
});
