"use strict";

let UserData = require('sb/user/UserData.js')
let clone = require('clone')

describe("helper", function () {

	it("UserData should work correctly", function (done) {

		let userData = new UserData();
        userData.initialize();

        console.log(userData.phraseFrequency)
        console.log(userData.history)
		
        done();

	});

    it("Check that deep copy works properly", function (done) {

		let userData = new UserData();
        userData.initialize();

        userData.unshiftHistory({a : "firstObj"})
        userData.unshiftHistory({a : "secondObj"})

        let data1 = clone(userData);
        let data2 = clone(userData);

        data2.unshiftHistory({a:"thirdObj"})

        console.log('userData.history',userData.history)
        console.log('data1.history',data1.history);
        console.log('data2.history',data2.history);

        done();
	});
});