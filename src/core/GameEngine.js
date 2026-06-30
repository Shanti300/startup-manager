/**
 * GameEngine — Orquestador principal
 * Coordina todos los sistemas. Es el director de orquesta.
 */

import Store from './Store.js'
import EventBus from './EventBus.js'
import TimeEngine from './TimeEngine.js'

const GameEngine = {
  initialized: false,

  init(companyName = 'Mi Startup') {
    if (this.initialized) return

    Store.dispatch({
      type: 'META_SET',
      payload: {
        companyName,
        foundedAt: new Date().toISOString(),
      },
    })

    this._setupListeners()
    this.initialized = true

    EventBus.emit('game.started', { companyName })
    console.log(`?? [GameEngine] "${companyName}" iniciada — Sprint 0`)
  },

  advanceSprint() {
    const state = Store.getState()
    const sprintNumber = state.sprint.current

    console.log(`? [GameEngine] Procesando Sprint ${sprintNumber}...`)
    EventBus.emit('sprint.processing', { sprintNumber })

    // 1. Resolver efectos diferidos que maduran este sprint
    const resolved = TimeEngine.resolveEffects()
    if (resolved.length > 0) {
      console.log(`?? [GameEngine] ${resolved.length} efecto(s) resuelto(s)`)
    }

    // 2. Procesar decisiones encoladas
    const decisions = state.sprint.decisionsQueue
    decisions.forEach((decision) => {
      EventBus.emit('decision.execute', { decision })
    })

    // 3. Avanzar el contador de sprint
    Store.dispatch({ type: 'SPRINT_ADVANCE' })

    const newState = Store.getState()
    EventBus.emit('sprint.completed', {
      sprintNumber: newState.sprint.current,
      resolvedEffects: resolved,
      decisionsProcessed: decisions,
    })

    console.log(`? [GameEngine] Sprint ${newState.sprint.current} iniciado`)
    return newState
  },

  queueDecision(decision) {
    const state = Store.getState()
    if (state.sprint.decisionsRemaining <= 0) {
      EventBus.emit('decision.rejected', { reason: 'Sin decisiones disponibles este sprint' })
      return false
    }

    Store.dispatch({ type: 'DECISION_ENQUEUE', payload: decision })
    EventBus.emit('decision.queued', { decision })
    return true
  },

  _setupListeners() {
    EventBus.on('effect.resolved', ({ effect }) => {
      console.log(`?? [TimeEngine] Efecto resuelto: ${effect.description}`)
    })

    EventBus.on('decision.queued', ({ decision }) => {
      console.log(`?? [GameEngine] Decisión encolada: ${decision.description}`)
    })
  },
}

export default GameEngine
