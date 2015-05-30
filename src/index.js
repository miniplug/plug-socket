import WebSocket from 'ws'

export default function socket(authToken = null) {
  let ws = new WebSocket('wss://godj.plug.dj:443/socket', {
    origin: 'https://plug.dj'
  })

  ws.on('message', msg => {
    if (msg === 'h') return
    const actions = JSON.parse(msg)
    if (!Array.isArray(actions)) return
    actions.forEach(({ a: action, p: param, s: slug }) => {
      ws.emit(action, param, slug)
    })
  })

  ws.sendMessage = (action, param) => {
    ws.send(JSON.stringify({ a: action
                           , p: param
                           , t: Math.floor(Date.now() / 1000) }))
    return ws
  }

  ws.auth = param => ws.sendMessage('auth', param)
  ws.chat = param => ws.sendMessage('chat', param)

  ws.on('open', () => {
    if (authToken) ws.auth(authToken)
  })

  return ws

}
