import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'
import EventBus from '../../src/core/EventBus.js'
import CellSystem from '../../src/systems/cells/CellSystem.js'
import MethodologySystem from '../../src/systems/methodology/MethodologySystem.js'
import ArchitectureSystem from '../../src/systems/architecture/ArchitectureSystem.js'
import SynergyEngine from '../../src/systems/cells/SynergyEngine.js'

describe('MethodologySystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
    SynergyEngine.activeSynergies = []
  })

  it('retorna todas las metodologias', () => {
    const all = MethodologySystem.getAll()
    expect(Object.keys(all)).toContain('scrum')
    expect(Object.keys(all)).toContain('kanban')
    expect(Object.keys(all)).toContain('waterfall')
  })

  it('cambia metodologia de una celula', () => {
    const cell = CellSystem.createCell('core')
    const result = MethodologySystem.setMethodology(cell.id, 'kanban')
    expect(result).toBe(true)
    expect(Store.getState().cells[0].methodology).toBe('kanban')
  })

  it('no cambia a la misma metodologia', () => {
    const cell = CellSystem.createCell('core')
    MethodologySystem.setMethodology(cell.id, 'scrum')
    const result = MethodologySystem.setMethodology(cell.id, 'scrum')
    expect(result).toBe(false)
  })

  it('celula en adaptacion tiene velocity reducido', () => {
    const cell = CellSystem.createCell('core')
    MethodologySystem.setMethodology(cell.id, 'kanban')
    const multiplier = MethodologySystem.getVelocityMultiplier(cell.id)
    expect(multiplier).toBe(0.6)
  })

  it('canAdopt retorna false si adaptabilidad insuficiente', () => {
    const devs = [{ stats: { adaptability: 3 } }]
    expect(MethodologySystem.canAdopt('shapeup', devs)).toBe(false)
  })

  it('canAdopt retorna true para metodologias sin requisito', () => {
    const devs = [{ stats: { adaptability: 1 } }]
    expect(MethodologySystem.canAdopt('scrum', devs)).toBe(true)
  })
})

describe('ArchitectureSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('setInitial establece arquitectura correctamente', () => {
    ArchitectureSystem.setInitial('monolith')
    expect(ArchitectureSystem.getCurrent().id).toBe('monolith')
  })

  it('migrate inicia la migracion', () => {
    ArchitectureSystem.setInitial('monolith')
    ArchitectureSystem.migrate('microservices')
    expect(ArchitectureSystem.isMigrating()).toBe(true)
  })

  it('no permite dos migraciones simultaneas', () => {
    ArchitectureSystem.setInitial('monolith')
    ArchitectureSystem.migrate('microservices')
    const result = ArchitectureSystem.migrate('serverless')
    expect(result).toBe(false)
  })

  it('getInfraCostMultiplier refleja la arquitectura actual', () => {
    ArchitectureSystem.setInitial('microservices')
    expect(ArchitectureSystem.getInfraCostMultiplier()).toBe(2.0)
  })

  it('getVelocityBonus es negativo durante migracion', () => {
    ArchitectureSystem.setInitial('monolith')
    ArchitectureSystem.migrate('microservices')
    expect(ArchitectureSystem.getVelocityBonus()).toBe(-2)
  })
})
