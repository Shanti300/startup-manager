/**
 * TechDebtEngine — La deuda técnica sube sola si no se atiende
 * Penaliza throughput y aumenta probabilidad de bugs e incidentes
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'

const DEBT_PER_SPRINT_BASE = 2
const DEBT_CRITICAL_THRESHOLD = 70
const DEBT_MAX = 100

const TechDebtEngine = {
  /**
   * Acumula deuda en todas las células al final de cada sprint
   */
  processSprint() {
    const state = Store.getState()
    const events = []

    state.cells.forEach((cell) => {
      const devCount = cell.devIds.length
      // Sin devs asignados la deuda sube más rápido
      const accumulation = devCount === 0
        ? DEBT_PER_SPRINT_BASE * 2
        : DEBT_PER_SPRINT_BASE - Math.min(1, devCount * 0.5)

      const newDebt = Math.min(DEBT_MAX, cell.techDebt + accumulation)

      Store.dispatch({
        type: 'CELL_UPDATE',
        payload: { id: cell.id, changes: { techDebt: Math.round(newDebt) } },
      })

      if (newDebt >= DEBT_CRITICAL_THRESHOLD && cell.techDebt < DEBT_CRITICAL_THRESHOLD) {
        events.push({ type: 'debt.critical', cell })
        EventBus.emit('techdebt.critical', { cell })
        console.warn(`?? [TechDebt] Deuda crítica en ${cell.label}: ${Math.round(newDebt)}%`)
      }
    })

    return events
  },

  /**
   * Acción: pagar deuda técnica de una célula (cuesta decisión + tiempo)
   */
  payDebt(cellId, amount = 20) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return false

    const newDebt = Math.max(0, cell.techDebt - amount)
    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { techDebt: newDebt } },
    })

    EventBus.emit('techdebt.paid', { cellId, reduced: amount, remaining: newDebt })
    console.log(`?? [TechDebt] Deuda reducida en ${cell.label}: -${amount}% ? ${newDebt}%`)
    return true
  },

  /**
   * Penalizador de throughput basado en deuda
   * 0% deuda = sin penalización | 100% deuda = -50% throughput
   */
  getThroughputPenalty(techDebt) {
    return 1 - (techDebt / 100) * 0.5
  },
}

export default TechDebtEngine
