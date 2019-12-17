let requireDirectory = require('require-directory')
let boteng = requireDirectory(module, './source/boteng', { include: /.*\.js/ })
let etc = requireDirectory(module, './source/etc', { include: /.*\.js/ })
let response = requireDirectory(module, './source/response', {
  include: /.*\.js/,
})
let user = requireDirectory(module, './source/user', { include: /.*\.js/ })

module.exports = {
  boteng: boteng,
  etc: etc,
  response: response
}
