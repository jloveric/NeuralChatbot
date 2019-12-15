'use strict'

//TODO: I don't like that this is in here'
let FromStorageAction = require('../boteng/FromStorageAction.js')

let debug = require('debug')('BotEngine')

class BotEngine {
  constructor() {
    this.actionList = []
    this.actionMap = new Map()

    this.simpleFill = new FromStorageAction()
  }

  initialize(input) {
    for (let i = 0; i < this.actionList.length; i++) {
      this.actionList[i].initialize(input)
    }
  }

  getAction(name) {
    debug('actionMap', this.actionMap.keys())
    return this.actionMap.get(name)
  }

  addAction(action) {
    this.actionList.push(action)
    this.actionMap.set(action.getName(), action)
  }

  //TODO: it looks like there is a bug in this
  //which needs to be checked.
  computeResult(input, userData, scoreBasedOnSearch) {
    let ans = { response: '' }

    //TODO: Again, I don't like calling this in here since it seems
    //like it doesn't belong.
    debug('Before basicAns')
    let basicAns = this.simpleFill.computeResult(input, userData)

    debug('basicAns', basicAns)
    for (let i = 0; i < this.actionList.length; i++) {
      if (this.actionList[i].filterInput(input)) {
        debug('input', input)
        let actualAns = this.actionList[i].computeResult(
          input,
          userData,
          scoreBasedOnSearch
        )

        //debug('basicAns wc', basicAns.wildcards)

        let np = new Promise((resolve, reject) => {
          Promise.all([actualAns, basicAns])
            .then(res => {
              debug('res.length', res.length)
              debug('actualAns', res[0])
              debug('basicAns', res[1], input.wildcards)
              /*if(!res[1]) {
                            res[1]={success : false}
                        }*/

              if (
                !res[0].success &&
                res[1].success &&
                input.wildcards.usedStorage
              ) {
                return resolve(res[1])
              } else {
                debug('Returning actualAns', res[0])
                return resolve(res[0])
              }
            })
            .catch(reason => {
              Logger.error('Ok, this should not be called!')
              debug('This should not be called')
              return reject(reason)
            })
        })

        return np
      }
    }
    return Promise.resolve(ans)
  }
}

module.exports = BotEngine
