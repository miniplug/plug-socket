plug-socket
===========

Simple plug.dj WebSocket EventEmitter library.

[![NPM](https://nodei.co/npm/plug-socket.png?downloads)](https://nodei.co/npm/plug-socket)

## Usage

```javascript
const plugSocket = require('plug-socket')
const authToken = '(...)' // get one by POST-ing to https://plug.dj/_/auth/token

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
[plug-login](https://github.com/goto-bus-stop/plug-login), and then sending a
POST request to https://plug.dj/_/auth/token.

```javascript
const request = require('request')
const plugLogin = require('plug-login')
const plugSocket = require('plug-socket')

plugLogin(myEmail, myPassword, (e, result) => {
  request.post(
    'https://plug.dj/_/auth/token'
    // use the plug-login cookie jar for authentication
  , { json: true, jar: result.jar }
  , (e, _, body) => {
    let authToken = body.data[0]
    plugSocket(authToken)
  })
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
you to filter those.

```javascript
socket.on('chat', (param, slug) => {
  log(`${slug}: receiving`, param)
})
```

## Building

```
npm run babel
```

## Tests

Tests use `mocha`. Running tests needs a plug.dj account, so `plug-login` can
get in, so `plug-socket` can connect. To allow the test suite to log in, sae
your credentials in a file called `test.json` at the root of this repo:
```json
{ "email": "your email address"
, "password": "your plug.dj password" }
```

Then run `npm test`. Tests depend on plug.dj being online and reachable, so you
might get test failures if it's slow or in maintenance mode.

## License

[MIT](./LICENSE)
