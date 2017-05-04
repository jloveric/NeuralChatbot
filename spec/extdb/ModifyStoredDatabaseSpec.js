"use strict"

let MongoFilesystem = require('sb/extdb/MongoFilesystem.js');
let ModifyStoredDatabase = require('sb/extdb/ModifyStoredDatabase.js');


let fileDB = 'fileSystemTest'

describe("We should be able to modify a stored database", function () {

    it('Write a file to the database', function (done) {

        let dbModify = new ModifyStoredDatabase();
        let mongoFile = new MongoFilesystem();
        mongoFile.initialize(fileDB).then(() => {

            let p1 = mongoFile.deleteFile('someDB', 'john.loverich@gmail.com', 'databaseTemp')
            let p2 = mongoFile.deleteFile('someDB', 'john.loverich@gmail.com', 'database')

            Promise.all([p1,p2]).then(function () {
                let np = mongoFile.storeFileInMongo('uploads/groceries.csv',
                    'someDB', 'john.loverich@gmail.com', 'databaseTemp');
                    
                np.then((res) => {
                    console.log('success');
                    dbModify.initialize('someDB', 'john.loverich@gmail.com', 'databaseTemp',fileDB).then(() => {
                        console.log('initialized someDB')
                        expect(true).toBeTruthy();
                        //setInterval(()=>{  
                        done()
                        //}, 1000)
                        
                    }).catch((reason)=>{
                        console.log('failed',reason)
                        expect(false).toBeTruthy();
                        done();
                    });
                }).catch((reason) => {
                    console.log('failed', reason)
                    expect(false).toBeTruthy();
                    done()
                })
            }).catch((reason) => {
                expect(false).toBeTruthy();
                Logger.error(reason);
                done();
            })

        }).catch((reason) => {
            console.log('MongoFilesystem init failed', reason)
            expect(false).toBeTruthy();
            done();
        });
    }, 10000);

});