'use strict'

describe('Logger', function() {
  it('Should Test the Logger', function() {
    let Logger = require('helper-clockmaker').Logger('LoggerSpec')
    Logger.error('Testing the Logger')

    //Logger = require('../etc/Logger.js')();
    //Logger.error('Testing the Logger')
  })
})
