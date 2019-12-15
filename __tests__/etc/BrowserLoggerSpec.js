'use strict'

describe('BrowserLogger', function() {
  describe('Logging', function() {
    it('Should Write to the Console', function() {
      let BL = require('../etc/BrowserLogger.js')

      BL.info('testing info')
      BL.debug('testing debug')
      BL.warn('testing warn')
      BL.verbose('testing verbose')
      BL.error('testing error')
    })
  })
})
