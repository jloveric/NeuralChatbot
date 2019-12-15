'use strict'

let path = 'groceries.csv'
let EsModule = require('../response/ElasticSearchQuery.js')
let es = new EsModule()

describe('EsSearchSpec', function() {
  beforeAll(done => {
    //let uploadDir = process.cwd() + '/uploads'
    //console.log(uploadDir)

    console.log('initialize succeeded')
    let conf = {
      fileDatabase: 'filesystem',
      filename: path,
      user: 'john.loverich@gmail.com',
    }

    es.initialize(conf).then(() => {
      done()
    })
  })

  it('Should return Bacon', function(done) {
    let pval = es.searchFields('Bacun', 'item')
    let loc = -1

    pval
      .then(function(body) {
        let source = body[0]._source
        expect(source.item).toEqual('Bacon')
        expect(source.aisle).toEqual('Refrigerated Foods')

        done()
      })
      .catch(function(reason) {
        console.log('Failed to find bacon', reason)
      })
  })

  /*it("Should return a good search score", function (done) {
        let p0 = es.searchAndScore("Tuna","item");
        let p1 = es.searchAndScore("Tuna chunky","item");
        
        Promise.all([p0,p1]).then((res)=> {

            let res00=res[0][0].score
            let res01=res[0][1].score

            let res10=res[1][0].score

            console.log(res00)
            console.log(res01)
            console.log(res10)

            expect(res00.score).toBe(1)
            expect(res10.score).toBe(2);
            expect(res00.size==res10.size).toBeTruthy();

            expect(res00.matchScore[0]).toBe(1);
            expect(res10.matchScore[0]).toBe(1)
            expect(res10.matchScore[1]).toBe(1)

            done();
        }).catch(function (reason) {
            console.log("Failed to find bacon", reason);
        });
    });*/
})
