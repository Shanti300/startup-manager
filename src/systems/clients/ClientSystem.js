/**
 * ClientSystem — Health score, churn, expansión, onboarding
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import catalog from '../../data/clients.catalog.json'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInRange([min, max]) {
  return Math.floor(min + Math.random() * (max - min))
}

const ClientSystem = {
  generateClient(typeId = null) {
    const typeKey = typeId || pick(Object.keys(catalog.types))
    const type = catalog.types[typeKey]

    return {
      id: `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      typeId: typeKey,
      typeLabel: type.label,
      name: pick(catalog.companyNames),
      health: 80 + Math.floor(Math.random() * 20),
      mrr: randomInRange(type.revenueRange),
      trait: pick(type.traits),
      onboardingSprints: type.onboardingSprints,
      onboardingRemaining: type.onboardingSprints,
      active: false,
      churnThreshold: type.churnThreshold,
      healthDecayRate: type.healthDecayRate,
      signedAt: null,
    }
  },

  signClient(client) {
    const state = Store.getState()
    client.signedAt = state.sprint.current
    client.active = false // se activa después del onboarding

    Store.dispatch({ type: 'CLIENT_ADD', payload: client })
    EventBus.emit('client.signed', { client })
    console.log(`?? [ClientSystem] Cliente firmado: ${client.name} (${client.typeLabel}) — $${client.mrr}/mes`)
    console.log(`? Onboarding: ${client.onboardingSprints} sprint(s)`)
    return client
  },

  /**
   * Procesa clientes cada sprint: onboarding, health decay, churn
   */
  processSprint() {
    const state = Store.getState()
    const events = []
    let mrrDelta = 0

    state.clients.forEach((client) => {
      // Onboarding en progreso
      if (!client.active) {
        const remaining = client.onboardingRemaining - 1
        Store.dispatch({
          type: 'CLIENT_UPDATE',
          payload: { id: client.id, changes: { onboardingRemaining: remaining } },
        })

        if (remaining <= 0) {
          Store.dispatch({
            type: 'CLIENT_UPDATE',
            payload: { id: client.id, changes: { active: true, onboardingRemaining: 0 } },
          })
          mrrDelta += client.mrr
          EventBus.emit('client.activated', { client })
          console.log(`? [ClientSystem] ${client.name} onboarding completado — +$${client.mrr} MRR`)
        }
        return
      }

      // Health decay natural
      const newHealth = Math.max(0, client.health - client.healthDecayRate)
      Store.dispatch({
        type: 'CLIENT_UPDATE',
        payload: { id: client.id, changes: { health: newHealth } },
      })

      // Churn si health cae bajo el umbral
      if (newHealth <= client.churnThreshold) {
        events.push({ type: 'churn', client })
        this.churnClient(client.id)
        mrrDelta -= client.mrr
      }
    })

    // Actualizar MRR
    if (mrrDelta !== 0) {
      const current = Store.getState().finance
      Store.dispatch({
        type: 'FINANCE_UPDATE',
        payload: { mrr: Math.max(0, current.mrr + mrrDelta) },
      })
    }

    return events
  },

  /**
   * Acción: atender a un cliente sube su health
   */
  nurture(clientId, amount = 15) {
    const state = Store.getState()
    const client = state.clients.find((c) => c.id === clientId)
    if (!client) return false

    const newHealth = Math.min(100, client.health + amount)
    Store.dispatch({
      type: 'CLIENT_UPDATE',
      payload: { id: clientId, changes: { health: newHealth } },
    })

    EventBus.emit('client.nurtured', { clientId, newHealth })
    console.log(`?? [ClientSystem] ${client.name} health: ${client.health} ? ${newHealth}`)
    return newHealth
  },

  churnClient(clientId) {
    const state = Store.getState()
    const client = state.clients.find((c) => c.id === clientId)
    if (!client) return

    Store.dispatch({ type: 'CLIENT_REMOVE', payload: { id: clientId } })
    EventBus.emit('client.churned', { client })
    console.warn(`?? [ClientSystem] ${client.name} se fue — perdiste $${client.mrr} MRR`)
  },

  printClients() {
    const state = Store.getState()
    if (state.clients.length === 0) {
      console.log('?? Sin clientes todavía')
      return
    }
    console.log('\n?? Clientes:')
    state.clients.forEach((c) => {
      const status = c.active ? '?? Activo' : `? Onboarding (${c.onboardingRemaining} sprints)`
      console.log(`  ${c.name} (${c.typeLabel}) — $${c.mrr}/mes — Health: ${c.health}% — ${status}`)
    })
  },
}

export default ClientSystem
