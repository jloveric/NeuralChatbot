"use strict";

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = "botDB.config"
let PhrasexBot = require('sb/response/PhrasexBotLib.js').StandardPhrasexBot;
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let UserData = require('sb/user/UserData.js')
let gc = new GetConfigValues();

let rootName = gc.bot.rootName

describe("The PhrasexBotDBSpec to test clockmaker", function () {
	it("Should Return Good values", function (done) {
		let conf = { fileDatabase: 'filesystem', 
					user: 'root', filename: path,
					doc : {description :{name : rootName}} }
		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {
			let pList = []
				
			//Testing phrase forms variations
			pList.push(simpleTest(bot, "May I speak with lafayette", "Lafayette"))
			pList.push(simpleTest(bot, "Who is available?"))
			pList.push(simpleTest(bot, "who is this?","("+rootName+"|talking)"))
			pList.push(simpleTest(bot, "Talk to king soopers lafayette",null,true))
			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		});
	}, 10000);

});

var simpleTest = function (bot, phrase, keyword, success) {

	let userData = new UserData();
	userData.initialize();

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase, userData).then(function (ans) {
			let result = ans.response
			console.log("phrase:", phrase)
			console.log('result:', result)

			if(success) {
				expect(ans.success).toBe(success)
			}

			let foundUndefined = result.match(/undefined/i)

			expect(result != '').toBeTruthy();
			expect(!foundUndefined).toBeTruthy();
			console.log('foundUndefined', foundUndefined)
			console.log('')

			if (keyword) {
				let foundKeyword = result.match(new RegExp(keyword, "i"))
				console.log('foundKeyword', foundKeyword)
				expect(foundKeyword).toBeTruthy();
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
	userData.initialize();

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
	userData.initialize();

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase,userData).then(function (ans) {
			let result = ans.response
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