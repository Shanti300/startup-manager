/**
 * CellSystem — Gestión completa de células tecnológicas
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import TechDebtEngine from './TechDebtEngine.js'
import SynergyEngine from './SynergyEngine.js'
import catalog from '../../data/cells.catalog.json'

const CellSystem = {
  createCell(typeId) {
    const type = catalog.types.find((t) => t.id === typeId)
    if (!type) throw new Error(`Tipo de célula desconocido: ${typeId}`)

    const state = Store.getState()
    const exists = state.cells.find((c) => c.typeId === typeId)
    if (exists) {
      console.warn(`?? [CellSystem] Ya existe una célula de tipo ${typeId}`)
      return exists
    }

    const cell = {
      id: `cell_${typeId}_${Date.now().toString(36)}`,
      typeId,
      label: type.label,
      devIds: [],
      maturity: 1,
      techDebt: 0,
      throughput: 0,
      methodology: 'scrum',
    }

    Store.dispatch({ type: 'CELL_ADD', payload: cell })
    EventBus.emit('cell.created', { cell })
    console.log(`??? [CellSystem] Célula creada: ${cell.label}`)
    return cell
  },

  assignDeveloper(cellId, devId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    const dev = state.developers.find((d) => d.id === devId)

    if (!cell || !dev) return false

    if (cell.devIds.includes(devId)) {
      console.warn(`?? [CellSystem] ${dev.name} ya está en esta célula`)
      return false
    }

    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: devId, changes: { cellId } },
    })
    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { devIds: [...cell.devIds, devId] } },
    })

    EventBus.emit('cell.assigned', { cellId, devId, devName: dev.name })
    console.log(`?? [CellSystem] ${dev.name} asignado a ${cell.label}`)
    return true
  },

  removeDeveloper(cellId, devId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return false

    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { devIds: cell.devIds.filter((id) => id !== devId) } },
    })
    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: devId, changes: { cellId: null } },
    })

    EventBus.emit('cell.dev.removed', { cellId, devId })
    return true
  },

  /**
   * Calcula throughput real de una célula aplicando deuda y sinergias
   */
  calculateThroughput(cellId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return 0

    const devs = state.developers.filter((d) => cell.devIds.includes(d.id))
    const baseVelocity = devs.reduce((sum, d) => sum + d.stats.velocity, 0)
    const synergyBonus = SynergyEngine.getVelocityBonus()
    const debtPenalty = TechDebtEngine.getThroughputPenalty(cell.techDebt)
    const synergyMultiplier = SynergyEngine.getThroughputMultiplier(cell.typeId)

    const throughput = Math.round(
      (baseVelocity + synergyBonus) * debtPenalty * synergyMultiplier
    )

    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { throughput } },
    })

    return throughput
  },

  /**
   * Sube madurez de una célula (requiere inversión de sprints)
   */
  increaseMaturity(cellId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return false
    if (cell.maturity >= 5) {
      console.log(`? [CellSystem] ${cell.label} ya está en madurez máxima`)
      return false
    }

    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { maturity: cell.maturity + 1 } },
    })

    SynergyEngine.evaluate()
    EventBus.emit('cell.maturity.increased', { cellId, maturity: cell.maturity + 1 })
    console.log(`?? [CellSystem] ${cell.label} madurez ? ${cell.maturity + 1}`)
    return true
  },

  /**
   * Procesa todas las células al inicio de cada sprint
   */
  processSprint() {
    const state = Store.getState()
    state.cells.forEach((cell) => this.calculateThroughput(cell.id))
    TechDebtEngine.processSprint()
    SynergyEngine.evaluate()
  },

  printCells() {
    const state = Store.getState()
    if (state.cells.length === 0) {
      console.log('??? Sin células creadas')
      return
    }
    console.log('\n?? Estado de células:')
    state.cells.forEach((cell) => {
      const devCount = cell.devIds.length
      console.log(`
  ${cell.label}
  + Devs: ${devCount} | Throughput: ${cell.throughput} pts
  + Madurez: ${'?'.repeat(cell.maturity)}${'?'.repeat(5 - cell.maturity)}
  + Deuda técnica: ${cell.techDebt}% ${cell.techDebt >= 70 ? '??' : cell.techDebt >= 40 ? '??' : '??'}
  + Metodología: ${cell.methodology}`)
    })
    SynergyEngine.printSynergies()
  },
}

export default CellSystem
