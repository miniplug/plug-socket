var WS = require('ws') // Will be empty object in browserified builds.
var WS_URL = 'wss://godj.plug.dj:443/socket'

var WSSTATE_OPEN = 1

module.exports = function socket (authToken) {
  var ws
  if (typeof WS === 'function') {
    ws = new WS(WS_URL, { origin: 'https://plug.dj' })
  } else {
    ws = new WebSocket(WS_URL)
  }

  var queue = []

  function onmessage (msg) {
    if (msg === 'h') {
      return null
    }

    var actions = JSON.parse(msg)
    if (!Array.isArray(actions)) {
      return null
    }

    actions.forEach(function (data) {
      // Action shape:
      // { a: action, p: param, s: slug }
      ws.emit(data.a, data.p, data.s)
    })
  }

  ws.sendMessage = function sendMessage (action, param) {
    if (ws.readyState === WSSTATE_OPEN) {
      ws.send(JSON.stringify({
        a: action,
        p: param,
        t: Math.floor(Date.now() / 1000)
      }))
    } else {
      queue.push({ action: action, param: param })
    }
    return ws
  }

  /**
   * Send all queued messages.
   */
  function onopen () {
    queue.forEach(function (message) {
      ws.sendMessage(message.action, message.param)
    })
  }

  ws.auth = function auth (param) {
    return ws.sendMessage('auth', param)
  }
  ws.chat = function chat (param) {
    return ws.sendMessage('chat', param)
  }

  ws.onmessage = onmessage
  ws.onopen = onopen

  if (authToken) {
    ws.auth(authToken)
  }

  return ws
}
