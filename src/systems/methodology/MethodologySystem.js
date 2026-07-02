/**
 * MethodologySystem — Aplica modificadores de metodología por célula
 * Cambiar de metodología tiene costo de adaptación
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import TimeEngine from '../../core/TimeEngine.js'
import catalog from '../../data/methodologies.json'

const MethodologySystem = {
  /**
   * Cambia la metodología de una célula
   * Cuesta 1-2 sprints de adaptación según el salto
   */
  setMethodology(cellId, methodologyId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    const methodology = catalog.methodologies[methodologyId]

    if (!cell) {
      console.warn(`? [Methodology] Célula no encontrada: ${cellId}`)
      return false
    }
    if (!methodology) {
      console.warn(`? [Methodology] Metodología desconocida: ${methodologyId}`)
      return false
    }
    if (cell.methodology === methodologyId) {
      console.log(`?? [Methodology] ${cell.label} ya usa ${methodology.label}`)
      return false
    }

    const prevMethodology = cell.methodology
    const adaptationDelay = methodologyId === 'waterfall' ? 2 : 1

    // Durante la adaptación, velocity baja temporalmente
    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: {
        id: cellId,
        changes: { methodology: methodologyId, adapting: true },
      },
    })

    // Después del delay, la célula se adapta completamente
    TimeEngine.scheduleEffect({
      description: `${cell.label} completó la transición a ${methodology.label}`,
      action: {
        type: 'CELL_UPDATE',
        payload: { id: cellId, changes: { adapting: false } },
      },
    }, adaptationDelay)

    EventBus.emit('methodology.changed', {
      cellId,
      from: prevMethodology,
      to: methodologyId,
      adaptationDelay,
    })

    console.log(`?? [Methodology] ${cell.label}: ${prevMethodology} ? ${methodology.label} (adaptación: ${adaptationDelay} sprint(s))`)
    return true
  },

  /**
   * Aplica los efectos de metodología al throughput de una célula
   */
  getVelocityMultiplier(cellId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return 1

    const methodology = catalog.methodologies[cell.methodology]
    if (!methodology) return 1

    // Si está en adaptación, penalización temporal
    if (cell.adapting) return 0.6

    return methodology.effects.velocityMultiplier
  },

  /**
   * Verifica si el equipo tiene la adaptabilidad requerida para una metodología
   */
  canAdopt(methodologyId, developers) {
    const methodology = catalog.methodologies[methodologyId]
    if (!methodology) return false

    const req = methodology.effects.adaptabilityRequirement
    if (req === 0) return true

    const avgAdaptability = developers.reduce((s, d) => s + d.stats.adaptability, 0) / developers.length
    return avgAdaptability >= req
  },

  getAll() {
    return catalog.methodologies
  },

  printMethodologies() {
    console.log('\n?? Metodologías disponibles:')
    Object.entries(catalog.methodologies).forEach(([id, m]) => {
      console.log(`  [${id}] ${m.label} — velocity x${m.effects.velocityMultiplier} | happiness ${m.effects.happinessModifier >= 0 ? '+' : ''}${m.effects.happinessModifier}`)
    })
  },
}

export default MethodologySystem
