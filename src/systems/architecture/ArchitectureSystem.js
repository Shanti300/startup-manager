/**
 * ArchitectureSystem — Gestión de arquitectura empresarial
 * Migrar arquitectura tiene costo alto y efectos diferidos largos
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import TimeEngine from '../../core/TimeEngine.js'
import catalog from '../../data/architectures.json'

const ARCHITECTURE_KEY = 'currentArchitecture'
const MIGRATING_KEY = 'migratingToArchitecture'

const ArchitectureSystem = {
  /**
   * Establece la arquitectura inicial (solo al inicio del run)
   */
  setInitial(architectureId) {
    const arch = catalog.architectures[architectureId]
    if (!arch) {
      console.warn(`? [Architecture] Arquitectura desconocida: ${architectureId}`)
      return false
    }

    Store.dispatch({ type: 'FLAG_SET', payload: { key: ARCHITECTURE_KEY, value: architectureId } })
    Store.dispatch({ type: 'FLAG_SET', payload: { key: MIGRATING_KEY, value: null } })

    EventBus.emit('architecture.set', { architectureId, arch })
    console.log(`??? [Architecture] Arquitectura inicial: ${arch.label}`)
    return true
  },

  /**
   * Inicia una migración de arquitectura
   * Costo: sprints de migración + penalización de velocity durante la migración
   */
  migrate(targetId) {
    const state = Store.getState()
    const currentId = state.flags[ARCHITECTURE_KEY] || 'monolith'
    const target = catalog.architectures[targetId]

    if (!target) {
      console.warn(`? [Architecture] Arquitectura desconocida: ${targetId}`)
      return false
    }
    if (currentId === targetId) {
      console.log(`?? [Architecture] Ya usas ${target.label}`)
      return false
    }
    if (state.flags[MIGRATING_KEY]) {
      console.warn(`? [Architecture] Ya hay una migración en progreso`)
      return false
    }

    const migrationCost = target.migrationCost
    Store.dispatch({ type: 'FLAG_SET', payload: { key: MIGRATING_KEY, value: targetId } })

    // La migración completa después de N sprints
    TimeEngine.scheduleEffect({
      description: `Migración a ${target.label} completada`,
      action: {
        type: 'FLAG_SET',
        payload: { key: ARCHITECTURE_KEY, value: targetId },
      },
    }, migrationCost)

    TimeEngine.scheduleEffect({
      description: `Migración finalizada — limpiar flag`,
      action: {
        type: 'FLAG_SET',
        payload: { key: MIGRATING_KEY, value: null },
      },
    }, migrationCost)

    EventBus.emit('architecture.migration.started', { from: currentId, to: targetId, migrationCost })
    console.log(`?? [Architecture] Migrando ${currentId} ? ${target.label} (${migrationCost} sprints)`)
    return true
  },

  getCurrent() {
    const state = Store.getState()
    const id = state.flags[ARCHITECTURE_KEY] || 'monolith'
    return { id, ...catalog.architectures[id] }
  },

  isMigrating() {
    return !!Store.getState().flags[MIGRATING_KEY]
  },

  /**
   * Retorna el multiplicador de costo de infra según la arquitectura actual
   */
  getInfraCostMultiplier() {
    const arch = this.getCurrent()
    return arch?.infraCostMultiplier || 1
  },

  getVelocityBonus() {
    if (this.isMigrating()) return -2
    const arch = this.getCurrent()
    return arch?.velocityBonus || 0
  },

  printCurrent() {
    const arch = this.getCurrent()
    const migrating = Store.getState().flags[MIGRATING_KEY]
    console.log(`
??? Arquitectura actual: ${arch.label}
   ${arch.description}
   Costo infra: x${arch.infraCostMultiplier} | Velocity bonus: +${arch.velocityBonus}
   Límite de escala: ${arch.scalingLimit} devs
   ${migrating ? `?? Migrando a: ${catalog.architectures[migrating]?.label}` : ''}`)
  },

  printAll() {
    console.log('\n??? Arquitecturas disponibles:')
    Object.entries(catalog.architectures).forEach(([id, a]) => {
      console.log(`  [${id}] ${a.label} — infra x${a.infraCostMultiplier} | migración: ${a.migrationCost} sprints`)
    })
  },
}

export default ArchitectureSystem
