'use strict'

let CreateMappingConfig = require('sb/etc/CreateMappingConfig.js')

describe('CreateMappingConfig', function() {
  it('Should create a mapping', function() {
    let cm = new CreateMappingConfig()

    cm.addMapping('this', 'item')
    cm.addMapping('that', 'place')
    cm.addMapping('other', 'price')

    expect(cm.validate()).toBeTruthy()

    cm.addMapping('slug', 'slimy')
    expect(cm.validate()).toBeFalsy()

    console.log('Mapping', cm.getMapping())
  })
})
