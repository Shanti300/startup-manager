import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'
import EventBus from '../../src/core/EventBus.js'
import DeveloperSystem from '../../src/systems/developers/DeveloperSystem.js'
import HRSystem from '../../src/systems/developers/HRSystem.js'
import { generateDeveloper } from '../../src/systems/developers/DeveloperGenerator.js'

describe('HRSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('processSprint decae happiness de todos los devs', () => {
    const dev = generateDeveloper()
    dev.happiness = 80
    DeveloperSystem.hire(dev)
    HRSystem.processSprint()
    expect(DeveloperSystem.getById(dev.id).happiness).toBeLessThan(80)
  })

  it('doOneOnOne sube happiness', () => {
    const dev = generateDeveloper()
    dev.happiness = 50
    DeveloperSystem.hire(dev)
    const gain = HRSystem.doOneOnOne(dev.id)
    expect(DeveloperSystem.getById(dev.id).happiness).toBeGreaterThan(50)
    expect(gain).toBeGreaterThan(0)
  })

  it('processSprint despide dev con happiness en 0', () => {
    const dev = generateDeveloper()
    dev.happiness = 1
    DeveloperSystem.hire(dev)
    // Bajamos happiness a 0 directamente en el store
    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: dev.id, changes: { happiness: 0 } },
    })
    // processSprint es quien detecta y despide
    HRSystem.processSprint()
    expect(Store.getState().developers).toHaveLength(0)
  })
})
