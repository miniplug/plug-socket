plug-socket
===========

Simple plug.dj WebSocket EventEmitter library.

[![NPM](https://nodei.co/npm/plug-socket.png?downloads)](https://nodei.co/npm/plug-socket)

## Usage

```javascript
const plugSocket = require('plug-socket')
const authToken = '(...)' // get one by GET-ing https://plug.dj/_/auth/token

let socket = plugSocket(authToken)
// events will be fired on "socket" for every incoming plug.dj message
socket.on('chat', msg => log(`<${msg.un}>  ${msg.message}`))
socket.on('userJoin', msg => log(`  * ${msg.un} joined the room`))
socket.on('plugMaintenanceAlert', () => log('#ded soon… ×.×'))
```

## API

### let socket = plugSocket(?authToken)

Sets up a WebSocket connection to plug.dj. If the auth token is given, it also
sends an "auth" message once the connection is open. Otherwise, you'll have to
send that yourself.

`socket` is a [WebSocket](https://github.com/websockets/ws) connection instance
with a few extra methods and a bunch of extra events.

### socket.auth(authToken)

Sends an auth token. You should only call this once, and only if you did not
pass one to the `plugSocket()` call.

You can obtain an auth token by logging in to plug.dj using something like
[plug-login](https://github.com/goto-bus-stop/plug-login), or by manually
sending a GET request to https://plug.dj/_/auth/token.

```javascript
const request = require('request')
const plugLogin = require('plug-login')
const plugSocket = require('plug-socket')

plugLogin(myEmail, myPassword, { authToken: true }, (e, result) => {
  let sock = plugSocket(result.token)
})

// connect using only a login session cookie
request.get(
  'https://plug.dj/_/auth/token'
  // use a cookie jar with a valid session cookie
, { json: true, jar: cookieJarWithSessionCookie }
, (e, _, body) => {
  let authToken = body.data[0]
  let sock = plugSocket(authToken)
})
```

### socket.chat(message)

Sends a chat message to the current room. Make sure to join a room first by
sending a POST request to https://plug.dj/_/rooms/join:

```javascript
request.post(
  'https://plug.dj/_/rooms/join'
, { json: true, jar: plugLoginJar
  , body: { slug: 'my-room-slug' } }
, (e, _, body) => { /* joined! */ })
```

### Events

Aside from the standard WebSocket events, `plug-socket` also emits different
events for all plug.dj message types. These are:

```javascript
[ "ack", "advance", "ban", "banIP", "chat", "chatDelete", "djListCycle"
, "djListLocked", "djListUpdate", "earn", "sub", "cash", "gift", "floodChat"
, "floodAPI", "friendRequest", "friendAccept", "gifted", "grab", "killSession"
, "modBan", "modAddDJ", "modRemoveDJ", "modMoveDJ", "modMute", "modSkip"
, "modStaff", "nameChanged", "nameChangedRoom", "notify", "playlistCycle"
, "plugMaintenance", "plugMaintenanceAlert", "plugMessage", "plugUpdate"
, "rateLimit", "roomNameUpdate", "roomDescriptionUpdate", "roomWelcomeUpdate"
, "roomMinChatLevelUpdate", "skip", "userJoin", "userLeave", "userUpdate"
, "vote" ]
```

Plug.dj events receive two arguments, `param` and `slug`. `param` is *usually*
an object, or `undefined` for some events. The `slug` parameter contains the
current room slug or "dashboard". When you switch rooms, sometimes you'll keep
receiving a few events from your previous room, so the `slug` parameter allows
you to filter those. You won't have to care for it if your app doesn't switch
rooms much.

```javascript
socket.on('chat', (param, slug) => {
  log(`${slug}: receiving`, param)
})
```

Most events are documented in more detail in the [PlugCommunity Documentation][plugcommunity docs]
repository.

## Building

```
npm run babel
```

## Tests

Tests use `mocha`. All tests depend on plug.dj being online and reachable, so
you might get test failures if it's slow, or in maintenance mode, or shut down
for a few months.

## License

[MIT][license]

[plugcommunity docs]: https://github.com/plugcommunity/documentation/tree/master/api/events/backend_events/
[license]: ./LICENSE
