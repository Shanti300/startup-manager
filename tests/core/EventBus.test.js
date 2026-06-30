import { describe, it, expect, beforeEach } from 'vitest'
import EventBus from '../../src/core/EventBus.js'

describe('EventBus', () => {
  beforeEach(() => EventBus.clear())

  it('emite y recibe un evento', () => {
    let received = null
    EventBus.on('test.event', (payload) => { received = payload })
    EventBus.emit('test.event', { value: 42 })
    expect(received).toEqual({ value: 42 })
  })

  it('multiples listeners reciben el mismo evento', () => {
    const results = []
    EventBus.on('multi', (p) => results.push('a'))
    EventBus.on('multi', (p) => results.push('b'))
    EventBus.emit('multi', {})
    expect(results).toEqual(['a', 'b'])
  })

  it('off elimina un listener', () => {
    let count = 0
    const cb = () => count++
    EventBus.on('remove.me', cb)
    EventBus.off('remove.me', cb)
    EventBus.emit('remove.me', {})
    expect(count).toBe(0)
  })

  it('no falla si se emite un evento sin listeners', () => {
    expect(() => EventBus.emit('nobody.listening', {})).not.toThrow()
  })
})
