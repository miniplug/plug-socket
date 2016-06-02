import request from 'request'
import { strictEqual as eq, ok, fail } from 'assert'
import { OPEN } from 'ws'
import * as login from 'plug-login'
import socket from '../src'

const room = 'plug-socket-test'

let jar = request.jar()
let token
let user
describe('plug.dj', function () {
  this.timeout(30000)

  it('is reachable', done => {
    request('https://plug.dj/', (e, {}, body) => {
      if (e)
        throw e
      if (body.indexOf('<title>maintenance') !== -1)
        throw new Error('plug.dj is currently in maintenance mode.')
      done()
    })
  })

  it('can connect as guest', done => {
    login.guest({ jar }, (e, result) => {
      if (e) return done(e)
      ok(result)
      done()
    })
  })

  it('gives a valid auth token', done => {
    login.getAuthToken({ jar }, (e, authToken) => {
      if (e) return done(e)
      ok(authToken)
      token = authToken
      done()
    })
  })

})

describe('plug-socket', function () {
  this.timeout(30000)

  it('can connect and authenticate with an auth token', done => {
    socket(token).once('ack', param => {
      eq(param, '1')
      done()
    })
  })

  it('can connect without an initial auth token', function (done) {
    let s = socket()
    s.on('ack', fail)
    setTimeout(() => {
      s.removeListener('ack', fail)

      s.on('ack', param => {
        eq(param, '1')
        done()
      }).auth(token)
    }, 1000)
  })

  it('emits events for chat', function (done) {
    const user = { id: 342546, username: 'test' }
    const testMsg = 'This is plug-socket speaking!'
    let s = socket()
    s.on('chat', msg => {
      if (msg.uid === user.id) {
        eq(msg.message, testMsg)
        done()
      }
    })
    s.emit('message', JSON.stringify([
      {
        a: 'chat',
        p: {
          cid: `${user.id}-${Date.now()}`,
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
