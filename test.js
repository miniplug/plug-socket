var fetch = require('node-fetch')
var assert = require('assert')
var http = require('http')
var WebSocket = require('ws')
var login = require('plug-login')
var socket = require('./')

var room = 'plug-socket-test'

var token
var user
describe('plug.dj', function () {
  this.timeout(30000)

  it('is reachable', function () {
    return fetch('https://plug.dj/').then(function (response) {
      return response.text()
    }).then(function (body) {
      if (body.indexOf('<title>maintenance') !== -1)
        throw new Error('plug.dj is currently in maintenance mode.')
    })
  })

  it('can connect as guest and gets a valid auth token', function () {
    return login.guest({ authToken: true }).then(function (result) {
      assert.ok(result)
      assert.ok(result.token)
      token = result.token
    })
  })
})

describe('plug-socket', function () {
  this.timeout(30000)
  var s

  beforeEach(function () {
    assert.ok(token, 'has an auth token')
  })

  afterEach(function () {
    if (s) s.close()
  })

  it('can connect and authenticate with an auth token', function (done) {
    s = socket(token)
    s.once('ack', function (param) {
      assert.strictEqual(param, '1')
      done()
    })
  })

  it('can connect without an initial auth token', function (done) {
    s = socket()
    s.on('ack', assert.fail)
    setTimeout(function () {
      s.removeListener('ack', assert.fail)

      s.on('ack', function (param) {
        assert.strictEqual(param, '1')
        done()
      }).auth(token)
    }, 1000)
  })

  it('emits events for chat', function (done) {
    var user = { id: 342546, username: 'test' }
    var testMsg = 'This is plug-socket speaking!'
    s = socket()
    s.on('chat', function (msg) {
      if (msg.uid === user.id) {
        assert.strictEqual(msg.message, testMsg)
        done()
      }
    })
    s.once('open', function () {
      s.onmessage({
        data: JSON.stringify([ {
          a: 'chat',
          p: {
            cid: user.id + '-' + Date.now(),
            message: testMsg,
            sub: 0,
            uid: user.id,
            un: user.username
          },
          s: room
        } ])
      })
    })
  })

  it('emits "action" events for each individual message', function (done) {
    s = socket()

    var calledEarn = false
    var calledGift = false
    var called = {}

    s.on('earn', function () {
      calledEarn = true
    })
    s.on('gift', function () {
      calledGift = true
    })
    s.on('action', function (action, param, slug) {
      called[action] = true
      assert.ok(param)
      assert.ok(slug)
    })

    s.once('open', function () {
      s.onmessage({
        data: JSON.stringify([
          { a: 'earn', p: { xp: 1000 }, s: 'dashboard' },
          { a: 'gift', p: { uid: -1 }, s: 'tastycat' }
        ])
      })

      assert.ok(calledEarn)
      assert.ok(calledGift)
      assert.ok(called.earn)
      assert.ok(called.gift)

      done()
    })
  })

  it('disconnects if a message has not been received for some time', function (done) {
    this.timeout(2000)

    var server = http.createServer().listen()
    var wsserver = new WebSocket.Server({ server: server })
    s = socket(null, {
      timeout: 300,
      url: 'ws://localhost:' + server.address().port
    })

    s.onclose = function (event) {
      assert.equal(event.code, 3001)

      server.close()
      done()
    }
  })
})
