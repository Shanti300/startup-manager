/**
 * PipelineSystem — Discovery, generación de oportunidades, cierre comercial
 */

import EventBus from '../../core/EventBus.js'
import ClientSystem from './ClientSystem.js'

const PipelineSystem = {
  opportunities: [],

  /**
   * Genera oportunidades comerciales disponibles este sprint
   */
  generateOpportunities(count = 3) {
    const types = ['startup', 'smb', 'enterprise', 'government']
    const weights = [40, 35, 20, 5]

    this.opportunities = Array.from({ length: count }, () => {
      const total = weights.reduce((a, b) => a + b, 0)
      let rand = Math.random() * total
      let typeId = types[types.length - 1]
      for (let i = 0; i < types.length; i++) {
        rand -= weights[i]
        if (rand <= 0) { typeId = types[i]; break }
      }
      return ClientSystem.generateClient(typeId)
    })

    console.log(`?? [Pipeline] ${count} oportunidades disponibles este sprint`)
    return this.opportunities
  },

  /**
   * Cerrar un deal — el cliente entra en onboarding
   */
  closeDeal(opportunityId) {
    const opp = this.opportunities.find((o) => o.id === opportunityId)
    if (!opp) {
      console.warn('? [Pipeline] Oportunidad no encontrada')
      return false
    }

    ClientSystem.signClient(opp)
    this.opportunities = this.opportunities.filter((o) => o.id !== opportunityId)
    EventBus.emit('pipeline.deal.closed', { client: opp })
    return true
  },

  /**
   * Rotar oportunidades — las que no se cierran desaparecen
   */
  rotate() {
    const expired = this.opportunities.length
    this.generateOpportunities(3)
    if (expired > 0) console.log(`?? [Pipeline] ${expired} oportunidad(es) expirada(s)`)
  },

  printOpportunities() {
    if (this.opportunities.length === 0) {
      console.log('?? Sin oportunidades en el pipeline')
      return
    }
    console.log('\n?? Oportunidades disponibles:')
    this.opportunities.forEach((o) => {
      console.log(`  [${o.id}] ${o.name} (${o.typeLabel}) — $${o.mrr}/mes — Onboarding: ${o.onboardingSprints} sprint(s) — "${o.trait}"`)
    })
  },
}

export default PipelineSystem
