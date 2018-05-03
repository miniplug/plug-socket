import WebSocket from 'ws'

const WS_URL = 'wss://ws-prod.plug.dj:443/socket'
const WS_ORIGIN = 'https://plug.dj'

const WSSTATE_OPEN = 1
const HEARTBEAT_TIMEOUT = 25 * 1000

export default function socket (authToken, options) {
  const wsUrl = options && options.url || WS_URL
  const wsOrigin = options && options.origin || WS_ORIGIN
  const heartbeatTimeout = options && options.timeout || HEARTBEAT_TIMEOUT

  const ws = new WebSocket(wsUrl, { origin: wsOrigin })

  const queue = []
  let heartbeat

  function gotHeartbeat () {
    if (heartbeat) clearTimeout(heartbeat)
    heartbeat = setTimeout(ontimedout, heartbeatTimeout)
  }

  function onmessage (event) {
    gotHeartbeat()

    if (event.data === 'h') {
      return null
    }

    const actions = JSON.parse(event.data)
    if (!Array.isArray(actions)) {
      return null
    }

    actions.forEach((data) => {
      // Action shape:
      // { a: action, p: param, s: slug }
      ws.emit(data.a, data.p, data.s)
      ws.emit('action', data.a, data.p, data.s)
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
    gotHeartbeat()
    queue.forEach((message) => {
      ws.sendMessage(message.action, message.param)
    })
  }

  function onclose () {
    if (heartbeat) clearTimeout(heartbeat)
  }

  /**
   * When we haven't received a heartbeat for some time, the connection might
   * have stopped working.
   */
  function ontimedout () {
    ws.close(3001, 'Timed out: did not receive heartbeat from plug.dj')
  }

  ws.auth = function auth (param) {
    return ws.sendMessage('auth', param)
  }
  ws.chat = function chat (param) {
    return ws.sendMessage('chat', param)
  }

  ws.onmessage = onmessage
  ws.onopen = onopen
  ws.onclose = onclose

  if (authToken) {
    ws.auth(authToken)
  }

  return ws
}
