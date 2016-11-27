var request = require('request')
var assert = require('assert')
var WebSocket = require('ws')
var login = require('plug-login')
var socket = require('../')

var room = 'plug-socket-test'

var jar = request.jar()
var token
var user
describe('plug.dj', function () {
  this.timeout(30000)

  it('is reachable', function (done) {
    request('https://plug.dj/', function (e, _, body) {
      if (e)
        throw e
      if (body.indexOf('<title>maintenance') !== -1)
        throw new Error('plug.dj is currently in maintenance mode.')
      done()
    })
  })

  it('can connect as guest', function (done) {
    login.guest({ jar: jar }, function (e, result) {
      if (e) return done(e)
      assert.ok(result)
      done()
    })
  })

  it('gives a valid auth token', function (done) {
    login.getAuthToken({ jar: jar }, function (e, authToken) {
      if (e) return done(e)
      assert.ok(authToken)
      token = authToken
      done()
    })
  })
})

describe('plug-socket', function () {
  this.timeout(30000)

  it('can connect and authenticate with an auth token', function (done) {
    socket(token).once('ack', function (param) {
      assert.strictEqual(param, '1')
      done()
    })
  })

  it('can connect without an initial auth token', function (done) {
    var s = socket()
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
    var s = socket()
    s.on('chat', function (msg) {
      if (msg.uid === user.id) {
        assert.strictEqual(msg.message, testMsg)
        done()
      }
    })
    s.emit('message', JSON.stringify([
      {
        a: 'chat',
        p: {
          cid: user.id + '-' + Date.now(),
          message: testMsg,
          sub: 0,
          uid: user.id,
          un: user.username
        },
        s: room
      }
    ]))
  })
})
