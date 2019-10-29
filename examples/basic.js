let BasicBot = require('sb/response/PhrasexBotLib.js').BasicBot
let UserData = require('sb/user/UserData.js')

//fileDatabase should always be 'filesystem'
//somebotname is your bots name - anything you want, but it can't match an existing bot
//uniqueindex should be all LOWERCASE and is the name of the index in elasticsearch
let conf = {
  fileDatabase: 'filesystem',
  doc: {
    description: {
      name: 'somebotname',
    },
  },
  phraseTable: 'uniqueindex',
}

let userData = new UserData()
userData.initialize()

let bot = new BasicBot()
bot
  .initialize(conf)
  .then(() => {
    bot
      .getResult('ho bome', userData)
      .then(ans => {
        console.log(ans)
        bot.close()
        process.exit(0)
      })
      .catch(reason => {
        console.log('error', reason)
        bot.close()
        process.exit(0)
      })
  })
  .catch(reason => {
    console.log('error', reason)
  })
