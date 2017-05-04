"use strict";

let spawn = require('child_process').spawn;
let exec = require('child_process').exec;

describe("Testing the utility CreateBot", function () {

  it("Should create a new bot", function (done) {

    let np = new Promise((resolve, reject) => {
      exec('source/util/CreateBot.js --username random --password tunafish --install uploads/cbottest.install',
        (error, stdout, stderr) => {

          if (error) {
            expect(false).toEqual(true);
          }

          if (stdout) {
            console.log('stdout', stdout);
          }

          if (stderr) {
            console.log('stderr', stderr);
          }

          resolve();
        });
    })

    np.then(() => {
      done();
    })

  }, 50000);

  it("Should fail since bot exists", function (done) {

    //A bot with the same name already exists

    exec('source/util/CreateBot.js --username blubber --password tunafish --install uploads/cbottest.install',
      (error, stdout, stderr) => {

        if (error) {
          expect(false).toEqual(true);
        }

        if (stdout) {
          console.log('stdout', stdout);
          //expect(false).toEqual(true);
        }

        if (stderr) {
          console.log('stderr', stderr);
          expect(stderr.match(/In Use/g)!=null).toEqual(true);
        }
        done();
      });

  })

  it("Should fail since username is missing", function (done) {
    //Missing a variable

    exec('source/util/CreateBot.js --password tunafish --install uploads/cbottest.install',
      (error, stdout, stderr) => {
        if (error) {
          expect(false).toEqual(true);
        }

        if (stdout) {
          console.log('stdout', stdout);
        }

        if (stderr) {
          console.log('stderr', stderr);
          expect(stderr.match(/username/g)!=null).toEqual(true)
        }
        done();
      });

  }, 50000);

  it("Now you should delete the whole thing", function (done) {
    //Missing a variable

    exec('source/util/DeleteUser.js --username random',
      (error, stdout, stderr) => {
        if (error) {
          console.log('error',error)
          expect(false).toEqual(true);
        }

        if (stdout) {
          console.log('stdout', stdout);
        }

        if (stderr) {
          console.log('stderr', stderr);
        }
        done();
      });

  }, 50000);

});

