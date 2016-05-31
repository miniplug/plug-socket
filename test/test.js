import request from 'request'
import { strictEqual as eq, ok, fail } from 'assert'
import { OPEN } from 'ws'
import login from 'plug-login'
import socket from '../src'

const room = 'plug-socket-test'

let jar = request.jar()
let token
let user
describe('plug.dj', function () {
  this.timeout(5000)

  it('is reachable', done => {
    request('https://plug.dj/', (e, {}, body) => {
      if (e)
        throw e
      if (body.indexOf('<title>maintenance') !== -1)
        throw new Error('plug.dj is currently in maintenance mode.')
      done()
    })
  })

  it('can login with valid credentials', done => {
    login.guest({ jar }, (e, result) => {
      if (e) throw e
      eq(result.body.status, 'ok')
      user = result.body.data[0]
      done()
    })
  })

  it('gives a valid auth token', done => {
    request('https://plug.dj/_/auth/token', { json: true, jar }, (e, _, body) => {
      if (e) throw e
      ok(body.data[0])
      token = body.data[0]
      done()
    })
  })

})

describe('plug-socket', function () {

  it('can connect and authenticate with an auth token', done => {
    socket(token).once('ack', param => {
      eq(param, '1')
      done()
    })
  })

  it('can connect without an initial auth token', function (done) {
    this.timeout(3000)

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
    this.timeout(5000)
    const testMsg = 'This is plug-socket speaking!'
    let s = socket(token)
    s.on('open', () => {
      request.post(
        'https://plug.dj/_/rooms/join'
      , { json: true, body: { slug: room }, jar }
      , (e, _, body) => {
        if (e) throw e
        eq(body.status, 'ok')

        s.chat(testMsg).on('chat', msg => {
          if (msg.uid === user.id) {
            eq(msg.message, testMsg)
            done()
          }
        })
      })
    })
  })

})
