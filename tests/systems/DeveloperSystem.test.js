import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'
import EventBus from '../../src/core/EventBus.js'
import DeveloperSystem from '../../src/systems/developers/DeveloperSystem.js'
import { generateDeveloper } from '../../src/systems/developers/DeveloperGenerator.js'

describe('DeveloperSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('contrata un dev y actualiza el estado', () => {
    const dev = generateDeveloper('frontend')
    DeveloperSystem.hire(dev)
    const state = Store.getState()
    expect(state.developers).toHaveLength(1)
    expect(state.developers[0].name).toBe(dev.name)
  })

  it('contratar sube el burnRate', () => {
    const dev = generateDeveloper()
    DeveloperSystem.hire(dev)
    expect(Store.getState().finance.burnRate).toBe(dev.salary)
  })

  it('despedir baja el burnRate', () => {
    const dev = generateDeveloper()
    DeveloperSystem.hire(dev)
    DeveloperSystem.fire(dev.id)
    expect(Store.getState().finance.burnRate).toBe(0)
    expect(Store.getState().developers).toHaveLength(0)
  })

  it('updateHappiness no baja de 0 ni sube de 100', () => {
    const dev = generateDeveloper()
    DeveloperSystem.hire(dev)
    DeveloperSystem.updateHappiness(dev.id, -9999)
    expect(DeveloperSystem.getById(dev.id).happiness).toBe(0)
    DeveloperSystem.updateHappiness(dev.id, 9999)
    expect(DeveloperSystem.getById(dev.id).happiness).toBe(100)
  })

  it('getTeamStats calcula correctamente', () => {
    DeveloperSystem.hire(generateDeveloper())
    DeveloperSystem.hire(generateDeveloper())
    const stats = DeveloperSystem.getTeamStats()
    expect(stats.count).toBe(2)
    expect(stats.burnRate).toBeGreaterThan(0)
  })
})
