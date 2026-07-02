import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'
import EventBus from '../../src/core/EventBus.js'
import CellSystem from '../../src/systems/cells/CellSystem.js'
import TechDebtEngine from '../../src/systems/cells/TechDebtEngine.js'
import SynergyEngine from '../../src/systems/cells/SynergyEngine.js'
import DeveloperSystem from '../../src/systems/developers/DeveloperSystem.js'
import { generateDeveloper } from '../../src/systems/developers/DeveloperGenerator.js'

describe('CellSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
    SynergyEngine.activeSynergies = []
  })

  it('crea una célula correctamente', () => {
    const cell = CellSystem.createCell('core')
    expect(Store.getState().cells).toHaveLength(1)
    expect(cell.typeId).toBe('core')
    expect(cell.maturity).toBe(1)
    expect(cell.techDebt).toBe(0)
  })

  it('no crea dos células del mismo tipo', () => {
    CellSystem.createCell('core')
    CellSystem.createCell('core')
    expect(Store.getState().cells).toHaveLength(1)
  })

  it('asigna un dev a una célula', () => {
    const cell = CellSystem.createCell('core')
    const dev = generateDeveloper()
    DeveloperSystem.hire(dev)
    CellSystem.assignDeveloper(cell.id, dev.id)
    const state = Store.getState()
    expect(state.cells[0].devIds).toContain(dev.id)
    expect(state.developers[0].cellId).toBe(cell.id)
  })

  it('calcula throughput con devs asignados', () => {
    const cell = CellSystem.createCell('core')
    const dev = generateDeveloper()
    DeveloperSystem.hire(dev)
    CellSystem.assignDeveloper(cell.id, dev.id)
    const throughput = CellSystem.calculateThroughput(cell.id)
    expect(throughput).toBeGreaterThan(0)
  })

  it('sube madurez hasta max 5', () => {
    const cell = CellSystem.createCell('core')
    for (let i = 0; i < 6; i++) CellSystem.increaseMaturity(cell.id)
    expect(Store.getState().cells[0].maturity).toBe(5)
  })
})

describe('TechDebtEngine', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('acumula deuda en celulas sin devs', () => {
    CellSystem.createCell('core')
    TechDebtEngine.processSprint()
    const debt = Store.getState().cells[0].techDebt
    expect(debt).toBeGreaterThan(0)
  })

  it('payDebt reduce la deuda', () => {
    CellSystem.createCell('platform')
    TechDebtEngine.processSprint()
    const cell = Store.getState().cells[0]
    TechDebtEngine.payDebt(cell.id, 10)
    expect(Store.getState().cells[0].techDebt).toBeLessThan(cell.techDebt)
  })

  it('getThroughputPenalty es 1 con 0 deuda y menor con deuda alta', () => {
    expect(TechDebtEngine.getThroughputPenalty(0)).toBe(1)
    expect(TechDebtEngine.getThroughputPenalty(100)).toBe(0.5)
  })
})

describe('SynergyEngine', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
    SynergyEngine.activeSynergies = []
  })

  it('sin celulas no hay sinergias', () => {
    const active = SynergyEngine.evaluate()
    expect(active).toHaveLength(0)
  })

  it('dx_boosts_all se activa con celula dx madura', () => {
    const cell = CellSystem.createCell('dx')
    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cell.id, changes: { maturity: 2 } },
    })
    const active = SynergyEngine.evaluate()
    expect(active.find((s) => s.id === 'dx_boosts_all')).toBeDefined()
  })
})
