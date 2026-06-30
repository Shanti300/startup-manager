/**
 * TimeEngine — Maneja efectos diferidos
 * "Contratar un dev senior hoy ? impacto en velocidad en sprint+2"
 */

import Store from './Store.js'
import EventBus from './EventBus.js'

const TimeEngine = {
  /**
   * Registra un efecto que se aplicará en sprintActual + delay
   */
  scheduleEffect(effect, delayInSprints = 1) {
    const state = Store.getState()
    const resolvesAt = state.sprint.current + delayInSprints

    Store.dispatch({
      type: 'EFFECT_ENQUEUE',
      payload: {
        id: `effect_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        description: effect.description,
        action: effect.action,
        resolvesAt,
        scheduledAt: state.sprint.current,
      },
    })

    EventBus.emit('effect.scheduled', {
      description: effect.description,
      resolvesAt,
    })
  },

  /**
   * Resuelve todos los efectos cuyo resolvesAt <= sprint actual
   * Se llama al inicio de cada sprint
   */
  resolveEffects() {
    Store.dispatch({ type: 'EFFECTS_RESOLVE' })
    const state = Store.getState()
    const resolved = state._resolvedEffects || []

    resolved.forEach((effect) => {
      Store.dispatch(effect.action)
      EventBus.emit('effect.resolved', { effect })
    })

    return resolved
  },
}

export default TimeEngine
