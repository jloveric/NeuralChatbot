let requireDirectory = require('require-directory')
let boteng = requireDirectory(module, './source/boteng', { include: /.*\.js/ })
let etc = requireDirectory(module, './source/etc', { include: /.*\.js/ })
let extdb = requireDirectory(module, './source/extdb', { include: /.*\.js/ })
let phrasex = requireDirectory(module, './source/phrasex', {
  include: /.*\.js/,
})
let response = requireDirectory(module, './source/response', {
  include: /.*\.js/,
})
let user = requireDirectory(module, './source/user', { include: /.*\.js/ })

module.exports = {
  boteng: boteng,
  etc: etc,
  extdb: extdb,
  phrasex: phrasex,
  response: response,
  user: user,
}
