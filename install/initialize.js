"use strict";

//let Mongodb = require('sb/dbio/MongoRecord.js');
//let MongoFilesystem = require('sb/extdb/MongoFilesystem.js')
//let CreateDefaultMongoData = require('sb/extdb/CreateDefaultMongoData.js')
//let Startup = require('sb/extdb/StartupDBSearch.js')

let pdb = require('sb/phrasex/BasicPhrasexDatabase.js')
let IndexPhraseDatabase = require('sb/phrasex/IndexPhraseDatabase.js')
let IndexBotDatabase = require('sb/phrasex/IndexPhraseDatabase.js')
let IndexMongoDatabase = require('sb/extdb/IndexMongoDatabase.js')
let BotInformation = require('sb/extdb/BotInformation.js')
let GetConfigValues = require('sb/etc/GetConfigValues.js')
let Helper = require('sb/etc/Helper.js')
//let InstallBot = require('sb/extdb/InstallBot.js')
let gc = new GetConfigValues();
let rootName = gc.bot.rootName

let rootConfig = {
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
        database: "botDatabase",
        collection: "bots",
        type: "mongo"
    },
    hello: ["Hello, I'm the Clockmaker", "I'm the Clockmaker, I can direct you to other bots."],
    goodbye: ["Bye from the Clockmaker!", "Until next time", "Until we speak again", "Later:)"],
    default: ["May I speak with (word)"],
    select: "send"
}

/**
 * All this spec does is initialize indexes that are then used by other
 * tests.
 */
let upsertRootBot = function () {
    let np = new Promise((resolve, reject) => {

        console.log('Stepping inside create root')
        console.log(gc.bot)
        let bi = new BotInformation();
        bi.initialize(gc.mongodb.botDatabase, gc.mongodb.url, gc.mongodb.botCollection).then(() => {
            return bi.update(gc.bot.rootUser, rootConfig)
        }).then(() => {
            console.log('Successfully installed root bot')
            resolve()
        }).catch(() => {
            console.log('Failed to update root bot')
            reject()
        })
    })

    return np;
}

let createPhraseDatabase = function () {

    let p = new Promise((resolve, reject) => {
        let filename = __dirname + '/../phrasedatabases/PhraseDatabase.json'
        let np = pdb.generatePhraseDatabase(filename)
        let ipd = new IndexPhraseDatabase();

        let pdbCount = null;

        //setTimeout(() => {
        np.then((tCount) => {
            pdbCount = tCount;
            console.log('stepped into np')
            return ipd.initialize()
        }).then(() => {
            console.log('initialized table')
            return ipd.createElasticsearchDatabase()
        }).then(() => {
            console.log('getting document count')
            return ipd.getDocumentCount('phrasedb')
        }).then((count) => {
            console.log('Finished', count, pdbCount)
            resolve()
        }).catch((reason) => {
            console.log("Couldn't initialize Phrase Database", reason)
            reject();
        })
    })

    return p;
}

//This is for one that cannot answer rdbms database questions
let createBasicPhraseDatabase = function () {

    let p = new Promise((resolve, reject) => {
        let filename = __dirname + '/../phrasedatabases/DudeDatabase.json'
        let np = pdb.generatePhraseDatabase(filename,'dudephrases')
        let ipd = new IndexMongoDatabase('phrasedb','dudephrases',null,'dudephrases');

        let pdbCount = null;

        //setTimeout(() => {
        np.then((tCount) => {
            pdbCount = tCount;
            console.log('stepped into np')
            return ipd.initialize()
        }).then(() => {
            console.log('initialized table')
            return ipd.createElasticsearchDatabase()
        }).then(() => {
            return ipd.getDocumentCount('phrasedb')
        }).then((count) => {
            console.log('Finished', count, pdbCount)
            resolve()
        }).catch((reason) => {
            console.log("Couldn't initialize Phrase Database", reason)
            reject();
        })
    })

    return p;
}


let indexBotDatabase = function () {

    let np = new Promise((resolve, reject) => {
        let ibd = new IndexBotDatabase();
        ibd.initialize().then(() => {
            console.log('initialized table')
            return ibd.createElasticsearchDatabase()
        }).then(() => {
            console.log('Finishing indexing the bot database.');
            resolve();
        }).catch((reason) => {
            console.log('Could not create elasticsearch bot database.', reason)
            reject();
        })
    })

    return np;
}

upsertRootBot().then(()=>{
    return createPhraseDatabase()
}).then(()=>{
    console.log('finished standard database')
    return createBasicPhraseDatabase();
}).then(()=>{
    console.log('finished small database')
    return indexBotDatabase()
}).then(()=>{
    console.log('finished bot database')
    process.exit(0)
})