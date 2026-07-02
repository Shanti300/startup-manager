/**
 * SynergyEngine — Calcula sinergias activas entre células
 * Las sinergias se descubren jugando, no están todas visibles desde el inicio
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import synergyMap from '../../data/synergies.json'

const SynergyEngine = {
  activeSynergies: [],

  /**
   * Evalúa qué sinergias están activas según el estado actual
   */
  evaluate() {
    const state = Store.getState()
    const cellsByType = {}
    state.cells.forEach((c) => { cellsByType[c.typeId] = c })

    const active = []

    synergyMap.synergies.forEach((synergy) => {
      // Verificar que todas las células requeridas existen
      const allPresent = synergy.requires.every((typeId) => cellsByType[typeId])
      if (!allPresent) return

      // Verificar madurez mínima
      const maturityOk = Object.entries(synergy.minMaturity || {}).every(
        ([typeId, minVal]) => (cellsByType[typeId]?.maturity || 0) >= minVal
      )
      if (!maturityOk) return

      active.push(synergy)
    })

    const prev = this.activeSynergies.map((s) => s.id)
    const next = active.map((s) => s.id)

    // Notificar sinergias nuevas descubiertas
    next.filter((id) => !prev.includes(id)).forEach((id) => {
      const synergy = active.find((s) => s.id === id)
      EventBus.emit('synergy.discovered', { synergy })
      console.log(`? [SynergyEngine] Sinergia desbloqueada: ${synergy.description}`)
    })

    this.activeSynergies = active
    return active
  },

  /**
   * Aplica los efectos de las sinergias activas al throughput de una célula
   */
  getThroughputMultiplier(cellTypeId) {
    let multiplier = 1

    this.activeSynergies.forEach((synergy) => {
      if (
        synergy.effect.stat === 'throughputMultiplier' &&
        synergy.effect.target === cellTypeId
      ) {
        multiplier *= synergy.effect.value
      }
    })

    return multiplier
  },

  getVelocityBonus() {
    return this.activeSynergies
      .filter((s) => s.effect.stat === 'velocityBonus' && s.effect.target === 'all')
      .reduce((sum, s) => sum + s.effect.value, 0)
  },

  getActiveSynergies() {
    return this.activeSynergies
  },

  printSynergies() {
    if (this.activeSynergies.length === 0) {
      console.log('?? Sin sinergias activas todavía')
      return
    }
    console.log('?? Sinergias activas:')
    this.activeSynergies.forEach((s) => console.log(`  ? ${s.description}`))
  },
}

export default SynergyEngine
