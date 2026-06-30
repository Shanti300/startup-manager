/**
 * SprintSystem — Orquesta el inicio de partida y las decisiones disponibles
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import GameEngine from '../../core/GameEngine.js'
import TimeEngine from '../../core/TimeEngine.js'
import CellSystem from '../cells/CellSystem.js'
import { generateDeveloper, generateMarketPool } from '../developers/DeveloperGenerator.js'

const SprintSystem = {
  marketPool: [],

  /**
   * Arranca un run nuevo: 1-2 devs iniciales gratis + célula Core + mercado
   */
  startNewRun(companyName = 'Mi Startup') {
    GameEngine.init(companyName)

    // Célula inicial
    const coreCell = CellSystem.createCell('core')

    // 1-2 devs iniciales gratis
    const starterCount = 1 + Math.floor(Math.random() * 2) // 1 o 2
    for (let i = 0; i < starterCount; i++) {
      const dev = generateDeveloper()
      dev.hiredAt = 0
      dev.available = false
      Store.dispatch({ type: 'DEVELOPER_ADD', payload: dev })
      CellSystem.assignDeveloper(coreCell.id, dev.id)
    }

    // Mercado inicial de fichajes
    this.marketPool = generateMarketPool(10)

    EventBus.emit('run.started', { companyName, starterCount })
    console.log(`?? Run iniciada con ${starterCount} dev(s) inicial(es) en Core Product`)
    this.printStatus()
  },

  /**
   * Decisión: contratar un dev del mercado
   */
  hireFromMarket(devId, cellId) {
    const state = Store.getState()
    if (state.sprint.decisionsRemaining <= 0) {
      console.warn('? Sin decisiones disponibles este sprint')
      return false
    }

    const devIndex = this.marketPool.findIndex((d) => d.id === devId)
    if (devIndex === -1) {
      console.warn('? Developer no encontrado en el mercado')
      return false
    }

    const dev = this.marketPool[devIndex]
    dev.hiredAt = state.sprint.current
    dev.available = false

    Store.dispatch({ type: 'DEVELOPER_ADD', payload: dev })
    CellSystem.assignDeveloper(cellId, dev.id)
    this.marketPool.splice(devIndex, 1)

    GameEngine.queueDecision({
      type: 'hire',
      description: `Contratar a ${dev.name} (${dev.roleLabel}) en célula ${cellId}`,
    })

    // El dev tarda 1 sprint en ser productivo al 100%
    TimeEngine.scheduleEffect({
      description: `${dev.name} ya se adaptó al equipo`,
      action: {
        type: 'DEVELOPER_UPDATE',
        payload: { id: dev.id, changes: { stats: { ...dev.stats, velocity: dev.stats.velocity + 1 } } },
      },
    }, 1)

    console.log(`? Contratado: ${dev.name} ? célula ${cellId}`)
    return true
  },

  /**
   * Decisión genérica (placeholder para futuras fases: metodología, arquitectura, etc.)
   */
  makeGenericDecision(description, effectDelay = 1, effectAction = null) {
    const state = Store.getState()
    if (state.sprint.decisionsRemaining <= 0) {
      console.warn('? Sin decisiones disponibles este sprint')
      return false
    }

    GameEngine.queueDecision({ type: 'generic', description })

    if (effectAction) {
      TimeEngine.scheduleEffect({ description: `Resultado de: ${description}`, action: effectAction }, effectDelay)
    }

    console.log(`?? Decisión registrada: ${description}`)
    return true
  },

  /**
   * Avanza al siguiente sprint
   */
  nextSprint() {
    GameEngine.advanceSprint()
    this.printStatus()
  },

  printStatus() {
    const state = Store.getState()
    console.log(`
????????????????????????????
?? Sprint ${state.sprint.current} — ${state.meta.companyName}
?? Cash: $${state.finance.cash} | MRR: $${state.finance.mrr}
?? Devs: ${state.developers.length} | Células: ${state.cells.length}
?? Decisiones disponibles: ${state.sprint.decisionsRemaining}/3
? Efectos pendientes: ${state.pendingEffects.length}
????????????????????????????`)
  },
}

export default SprintSystem
