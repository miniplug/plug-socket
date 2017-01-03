/**
 * Native browser WebSockets don't have a Node-style event emitter interface,
 * but the component-emitter module can add one.
 */

var emitter = require('component-emitter')

module.exports = function WS (url) {
  return emitter(new WebSocket(url))
}
