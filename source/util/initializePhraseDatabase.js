"use strict";

let pdb = require('sb/phrasex/BasicPhrasexDatabase.js')
let IndexMongoDatabase = require('sb/extdb/IndexMongoDatabase.js')
let Helper = require('sb/etc/Helper.js')

let args = require('minimist')(process.argv.slice(2));

if (!args.filename) {
    console.error('Must specify --filename')
    process.exit(0)
}
if (!args.indexname) {
    console.error('Must specify --indexname')
    process.exit(0)
}

//This is for one that cannot answer rdbms database questions
let createBasicPhraseDatabase = function (filenameIn, dbName) {

  let p = new Promise((resolve, reject) => {
    let filename = process.cwd() + '/' + filenameIn
    let np = pdb.generatePhraseDatabase(filename, dbName)
    let ipd = new IndexMongoDatabase('phrasedb', dbName, null, dbName);

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
      return ipd.getDocumentCount(dbName)
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

createBasicPhraseDatabase(args.filename,args.indexname).then(()=>{
  console.log('success')
  process.exit(0);
}).catch((reason)=>{
  console.log('error',reason)
  process.exit(0);
})

