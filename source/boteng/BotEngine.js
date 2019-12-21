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
  async computeResult(input, userData, scoreBasedOnSearch) {
    let ans = { response: '' }

    //TODO: Again, I don't like calling this in here since it seems
    //like it doesn't belong.
    debug('Before basicAns')
    let basicAns = await this.simpleFill.computeResult(input, userData)

    debug('basicAns', basicAns)
    for (let i = 0; i < this.actionList.length; i++) {
      if (this.actionList[i].filterInput(input)) {
        debug('input', input)
        let actualAns = await this.actionList[i].computeResult(
          input,
          userData,
          scoreBasedOnSearch
        )

        debug('actualAns', actualAns)
        debug('basicAns', basicAns, input.wildcards)

        if (
          !actualAns.success &&
          basicAns.success &&
          input.wildcards.usedStorage
        ) {
          return basicAns
        } else {
          debug('Returning actualAns', actualAns)
          return actualAns
        }
      }
    }
    return ans
  }
}

module.exports = BotEngine
