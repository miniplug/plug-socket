import WebSocket from 'ws'

export default function socket(authToken = null) {
  let ws = new WebSocket('wss://godj.plug.dj:443/socket', {
    origin: 'https://plug.dj'
  })

  let queue = []

  ws.on('message', msg => {
    if (msg === 'h') return null
    const actions = JSON.parse(msg)
    if (!Array.isArray(actions)) return null
    actions.forEach(({ a: action, p: param, s: slug }) => {
      ws.emit(action, param, slug)
    })
  })

  ws.sendMessage = (action, param) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ a: action
                             , p: param
                             , t: Math.floor(Date.now() / 1000) }))
    } else {
      queue.push({ action, param })
    }
    return ws
  }

  const drainQueue = () => {
    queue.forEach(({ action, param }) => {
      ws.sendMessage(action, param)
    })
  }
  ws.on('open', drainQueue)

  ws.auth = param => ws.sendMessage('auth', param)
  ws.chat = param => ws.sendMessage('chat', param)

  if (authToken) ws.auth(authToken)

  return ws
}
