"use strict";

//let path = __dirname+"/../uploads/groceries.csv.config"
let path = "groceries.csv"
let PhrasexBot = require('sb/response/PhrasexBotLib.js').StandardPhrasexBot;
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let UserData = require('sb/user/UserData.js')
let gc = new GetConfigValues();

let rootName = gc.bot.rootName

let conf = {
	fileDatabase: 'filesystem', user: 'john.loverich@gmail.com', filename: path,
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
			database: "groceries.csv",
			type: "rdbms"
		},
		default: ["Do you have any (word)"],
		config: {
			primary: ["item"]
		}
	}
}

describe("The PhrasexBotSpec wich groceries.csv", function () {

	/*it("Should Return Good values : -1 Set", function (done) {

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			bot.statisticsFlag = false
			let pList = []

			//Empty responses
			pList.push(simpleEmpty(bot, " "));
			pList.push(simpleTest(bot, "tuna", null, true));
			pList.push(simpleTest,(bot,"can of tuna", null, false))

			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		}).catch((reason)=>{
			console.log('reason',reason)
		})
	}, 10000);

	it("Should Return Good values : Zeroth Set", function (done) {

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			bot.statisticsFlag = false
			let pList = []
				
			//Testing phrase forms variations
			pList.push(simpleTest(bot, "Where can I find the tuna", "aisle"))
			pList.push(simpleTest(bot, "Ok, where are the tomatoes", "tomato"))
			pList.push(simpleTest(bot, "Ok, where and are the tomatoes", "tomato"))
			pList.push(simpleTest(bot, "Ok, and then where and are the tomatoes", "tomato"))
			pList.push(simpleTest(bot, "were r the tomatoes", "tomato"))
			pList.push(simpleTest(bot, "Tomatoes where r they", "tomato"))

			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		}).catch((reason)=>{
			console.log('reason',reason)
		})
	}, 10000);

	it("Should Return Good values : First Set", function (done) {

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			bot.statisticsFlag = false
			let pList = []
			
			//We don't want too many results to be returned -- This used to be aisle
			//"Not" test, but turns out we do want more results returned, especially
			//for larger databases.
		  pList.push(simpleTest(bot, "What kind of beer do you have", "beef"))
				
			//These ones periodically fail due to elasticsearch indexing errors
			pList.push(simpleTest(bot, "Where is the tuna", "tuna"));
			pList.push(simpleTest(bot, "How much does the cheese cost?", "cheese"))
			pList.push(simpleTest(bot, "Do you have wine", "White"))
			pList.push(simpleTestNot(bot, "Is there any rice", "price"))

			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		}).catch((reason)=>{
			console.log('reason',reason)
		})
}, 10000);


	it("Should Return Good values : Second Set", function (done) {

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {
			bot.statisticsFlag = false
			let pList = []

			//Questions that don't require search
			pList.push(simpleTest(bot,"Hello",null,true))
			
			pList.push(simpleTestNot(bot,"Any sausage","don't"))
			pList.push(simpleTest(bot,"Any sausage","yes",true))
			
			pList.push(simpleTest(bot,"Any tacos",null, false))
			pList.push(simpleTest(bot,"Where are the tacos",null, false))

			pList.push(simpleTest(bot, "Cottage Cheese", "yes", true))
			pList.push(simpleTest(bot, "Where are the at",null,false))

			//Phrases that are confused or lost
			//This is an important test because it returns no search in BasicAction
			//so it should always pass!
			pList.push(simpleTest(bot, "ches", "ches", false))
			
			//Expands it into "These" instead of "Cheese"
			pList.push(simpleTest(bot, "Chese", "yes", true))

			pList.push(simpleTest(bot,"can coke","yes", true))

			//Help and info
			pList.push(simpleTest(bot, "Help", "type", true))
			pList.push(simpleTest(bot, "info", "Lafayette", true))

			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		});
	}, 10000);

	it("Should Return Good values : Third Set", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {
			bot.statisticsFlag = false
			let pList = []

			//Questions that don't require search
			pList.push(simpleTest(bot, "What brats", "4-6 pack", true, userData).then(() => {
				return simpleTest(bot, "Do you have price", "Rice", true, userData)
			}).then(()=>{
				let a = simpleTest(bot, "what aisle is that located", "aisle", true, userData)
				let b = simpleTestNot(bot, "what aisle is that located", "Packaged Foods", true, userData)
				return Promise.all([a,b])
			}))

			//They shouldn't have price, but it seems it will match Rice
			//pList.push()


			Promise.all(pList).then(() => {
				bot.close();
				done();
			})
		});
	}, 10000);

	//Uhgg, unfortunately I made the scoring so good that the statistics
	//doesn't help anymore in this case.  TODO: Need to find another problem
	//that is solves so I can test it.
	//it("Testing the PhrasexBot statistics with fish", function (done) {

	//	let userData = new UserData();
	//	userData.initialize(1);

	//	let bot = new PhrasexBot();
	//	bot.initialize(conf).then(() => {

	//		let pList = []

	//Shouldn't recognize the question first of all.
	//		simpleTestNot(bot, "How fish", "Tilapia", true, userData).then(() => {
	//			return simpleTest(bot, "How much is the fish", "Tilapia", true, userData)
	//		}).then(() => {
	//			return simpleTest(bot, "How much is the fish", "Tilapia", true, userData)
	//		}).then(() => {
	//			return simpleTest(bot, "How fish", "1.18", true, userData)
	//		}).then(() => {
	//			bot.close();
	//			done();
	//		}).catch((reason)=>{
	//			console.log('error',reason)
	//		})
	//	}).catch((reason)=>{
	//		console.log('error',reason)
	//	});
	//}, 10000);*/

	it("Testing the PhrasexBot history starting with complete phrase", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			simpleTest(bot, "How much is the fish", "Tilapia", true, userData).then(() => {
				return simpleTest(bot, "How much", "Mahi", true, userData)
			}).then(() => {
				return simpleTest(bot, "How much", "Flounder", true, userData)
			}).then(() => {
				return simpleTest(bot, "Do you have any", "Tilapia", true, userData)
			}).then(() => {
				return simpleTest(bot, "What did I say", "Do you have any fish", true, userData)	
			}).then(() => {
				console.log('userData',userData.history)
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
	}, 10000);

	/*it("Testing the PhrasexBot history starting with fish", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			simpleTest(bot, "fish", "Tilapia", true, userData).then(() => {
				return simpleTest(bot, "How much", "Mahi", true, userData)
			}).then(() => {
				return simpleTest(bot, "How much", "Flounder", true, userData)
			}).then(() => {
				return simpleTest(bot, "Do you have any", "Tilapia", true, userData)
			}).then(() => {
				console.log('userData',userData.history)
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
}, 10000);
	

	it("Testing the PhrasexBot history starting with ice cream", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			simpleTest(bot, "ice cream", "Ice Cream", true, userData).then(() => {
				return simpleTest(bot, "price", "7.63", true, userData)
			}).then(() => {
				return simpleTest(bot, "Ice Cream", "Yes", true, userData)
			}).then(() => {
				return simpleTest(bot, "how much", "7.63", true, userData)
			}).then(()=>{
				return simpleTest(bot, "how much", "7.63", true, userData)
			}).then(() => {
				console.log('userData',userData.history)
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
	}, 10000);

	it("Testing the storage", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			simpleTest(bot, "my name is john", "john", true, userData).then(() => {
				return simpleTest(bot, "what is my name", "john", true, userData)
			}).then(() => {
				return noCheck(bot, "my favorite color is blue", userData)
			}).then(() => {
				return simpleTest(bot, "what is my favorite color", "blue", true, userData)
			}).then(()=>{
				console.log('storage',userData.getStorage().getObj())
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
	}, 10000);

	it("Testing the storage non self", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			noCheck(bot, "The tacos are in aisle 2", userData).then(() => {
				return simpleTest(bot, "where are the tacos", "aisle 2", true, userData)
			}).then(() => {
				console.log('storage',userData.getStorage().getObj())
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
	}, 10000);

	it("Testing location statements and questions with storage", function (done) {

		let userData = new UserData();
		userData.initialize(1);

		let bot = new PhrasexBot();
		bot.initialize(conf).then(() => {

			let pList = []

			noCheck(bot, "dinner is in the oven", userData).then(() => {
				return simpleTest(bot, "Where is dinner", "oven", true, userData)
			}).then(() => {
				console.log('storage',userData.getStorage().getObj())
				bot.close();
				done();
			}).catch((reason) => {
				console.log('error', reason)
			})

		}).catch((reason) => {
			console.log('error', reason)
		});
	}, 10000);

//TODO: activate again when we put back in "went"
	/*it("Testing go", function (done) {

		let userData = new UserData();
		userData.initialize(1);
		try {
			let bot = new PhrasexBot();
			bot.initialize(conf).then(() => {

				let pList = []

				noCheck(bot, "ben went to the store", userData).then(() => {
					return simpleTest(bot, "where is ben", "ben went to the store", true, userData)
				}).then(() => {
					console.log('finished')
					bot.close();
					done();
				}).catch((reason) => {
					console.log('error', reason)
				})

			}).catch((reason) => {
				console.log('error', reason)
			});
		} catch (e) {
			console.log('error',e)
		}
	}, 10000);*/

});

var noCheck = function (bot, phrase, userData) {
	if (!userData) {
		userData = new UserData();
		userData.initialize()
	}

	let p = new Promise((resolve, reject) => {
		bot.getResult(phrase, userData).then(function (ans) {
			expect(true).toBe(true);
			resolve()
		}).catch(function (reason) {
			console.log(reason)
			expect(false).toBeTruthy();
			resolve()
		});

	})

	return p;
}

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

			expect(result == '').toBeFalsy();
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