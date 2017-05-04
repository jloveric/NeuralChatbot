"use strict";

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = "pcc-grocery.csv"
let PhrasexBot = require('sb/response/PhrasexBotLib.js').StandardPhrasexBot;
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let UserData = require('sb/user/UserData.js')
let gc = new GetConfigValues();

let rootName = gc.bot.rootName

let conf = {
	fileDatabase: 'filesystem', user: 'a.hakim777@gmail.com', filename: path,
	doc: {
		description: {
			name: rootName,
			nickname: "allBot",
			purpose: "This bot controls all other bots",
			keywords: "chief,main,super,root,god",
			business: "N Infinity Computational Sciences",
			city: "Lafayette",
			state: "Colorado",
			county: "Boulder",
			country: "United States",
		},
		info: {
			database: "pcc-grocery.csv",
			type: "rdbms"
		},
		default: ["Do you have any (word)"]
	}
}

describe("The PhrasexBotSpec wich groceries.csv", function () {

	it("Should Return Good values : First Set", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			bot.statisticsFlag = false
			let pList = []

			//Empty responses
			console.log('did we even get in here')
			//pList.push(simpleTest(bot,"dog food", "dog food", true))
			pList.push(
				simpleTest(bot, "do you have dog food", "yes", true, userData).then(() => {
					return simpleTest(bot, "what aisle is that located", "aisle", true, userData)
				}).then(() => {
					return simpleTestNot(bot, "what the heeeck", "type 'more'", false, userData)
				})
			)

			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		}).catch((reason) => {
			console.log('reason', reason)
		})
	}, 10000);

});

var simpleTest = function (bot, phrase, keyword, success, userData) {

	if (!userData) {
		userData = new UserData();
		userData.initialize()
	}

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase, userData).then(function (ans) {
			console.log('ANS', ans)
			let good = ans.success
			let result = ans.response
			console.log("phrase:", phrase)
			console.log('result:', result)

			let foundUndefined = result.match(/undefined/i)

			console.log('ans.confidence', ans.confidence)
			expect(typeof ans.confidence === 'undefined').toBeFalsy()
			expect(result != '').toBeTruthy();
			expect(!foundUndefined).toBeTruthy();
			console.log('foundUndefined', foundUndefined)
			console.log('')

			if (keyword) {
				let foundKeyword = result.match(new RegExp(keyword, "i"))
				console.log('foundKeyword', keyword)
				expect(foundKeyword).toBeTruthy();
			}

			if (success != null) {
				expect(success).toBe(good);
				console.log(success, good)
			}

			resolve()
		}).catch(function (reason) {
			console.log(reason)
			expect(false).toBeTruthy();
			resolve()
		});

	})

	return p;
}

var simpleTestNot = function (bot, phrase, keyword) {

	let userData = new UserData();
	userData.initialize()

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase, userData).then(function (ans) {
			let result = ans.response
			console.log("phrase:", phrase)
			console.log('result:', result)

			let foundUndefined = result.match(/undefined/i)

			expect(result != '').toBeTruthy();
			expect(!foundUndefined).toBeTruthy();
			console.log('foundUndefined', foundUndefined)
			console.log('')

			if (keyword) {
				let foundKeyword = result.match(new RegExp(keyword, "i"))
				expect(foundKeyword).toBeFalsy();
			}
			resolve()
		}).catch(function (reason) {
			console.log(reason)
			expect(false).toBeTruthy();
			resolve()
		});

	})

	return p;
}

var simpleEmpty = function (bot, phrase) {

	let userData = new UserData();
	userData.initialize()

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase, userData).then(function (ans) {
			let result = ans.response;
			console.log("phrase:", phrase)
			console.log('result:', result)

			let foundUndefined = result.match(/undefined/i)

			expect(result == '').toBeTruthy();
			expect(!foundUndefined).toBeTruthy();
			console.log('foundUndefined', foundUndefined)
			console.log('')
			//console.log('smartbot test 1', bot.keyword);
			//expect(bot.keyword == "tuna").toBeTruthy();
			resolve()
		}).catch(function (reason) {
			console.log(reason)
			expect(false).toBeTruthy();
			resolve()
		});

	})

	return p;
}