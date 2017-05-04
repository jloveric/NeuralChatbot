"use strict";
let CreateDatabaseConfig = require('sb/extdb/CreateDatabaseConfig.js');
let MongoHelper = require('sb/extdb/MongoHelper.js');
let GridStore = require('mongodb').GridStore;
let fs = require('fs');

describe("CreateDatabaseConfig", function () {

	it("Should make a database config file", function (done) {
		let cl = new CreateDatabaseConfig();

		let columns = ['cost', 'animal'];//<------------Actual column names
		let mapping = ['price', 'item'];//<-------------generic class
		//let queries = ['GREETINGS', 'LOCATION', 'PRICE']
		let keywords = { cost: "price", animal: "animal" }

		let dbObj = {
			columns: columns,
			mapping: mapping,
			keywords: keywords,
			indexName: 'funnyIndex',
			filesystem: "fileSystemTest"
		}

		let p = cl.initialize(dbObj).then(() => {

			//cl.validate();
			//console.log(cl.getConfigObject())


			let np = cl.writeToFile('testDBConfig.config');

			np.then(function (res) {
				fs.readFile('testDBConfig.config', function (err, data) {
					let obj = JSON.parse(data);

					expect(obj.databaseNameMapping.cost).toEqual("price");
					expect(obj.databaseNameMapping.animal).toEqual("item");

					/*expect(obj.validResultTypes[0]).toEqual("GREETINGS");
					expect(obj.validResultTypes[1]).toEqual("LOCATION");
					expect(obj.validResultTypes[2]).toEqual("PRICE");*/

					expect(obj.keywords.cost).toEqual("price")
					expect(obj.keywords.animal).toEqual("animal")

					done();
				});
			});
		}).catch((reason) => {
			console.log('error for reason', reason)
		});

	});

	it("Should make a database mongo config file", function (done) {
		let cl = new CreateDatabaseConfig();
		let columns = ['cost', 'animal'];
		let mapping = ['price', 'item'];
		//let queries = ['GREETINGS', 'LOCATION', 'PRICE']
		let keywords = { cost: "price", animal: "animal" }

		let dbObj = {
			columns: columns,
			mapping: mapping,
			keywords: keywords,
			indexName: 'funnyIndex',
			filesystem: "fileSystemTest"
		}

		let p = cl.initialize(dbObj)

		p.then(() => {
			cl.validate();

			let np = cl.writeToMongo("testDBConfig", "testUser");
			np.then(() => {
				done();
			})
		}).catch((reason) => {
			console.log('error for reason', reason)
		});

	});

});