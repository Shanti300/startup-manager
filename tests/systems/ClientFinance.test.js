import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'
import EventBus from '../../src/core/EventBus.js'
import ClientSystem from '../../src/systems/clients/ClientSystem.js'
import FinanceSystem from '../../src/systems/finance/FinanceSystem.js'

describe('ClientSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('genera un cliente con campos requeridos', () => {
    const client = ClientSystem.generateClient('smb')
    expect(client).toHaveProperty('id')
    expect(client).toHaveProperty('mrr')
    expect(client.typeId).toBe('smb')
    expect(client.health).toBeGreaterThanOrEqual(80)
  })

  it('firmar cliente lo agrega al store', () => {
    const client = ClientSystem.generateClient('startup')
    ClientSystem.signClient(client)
    expect(Store.getState().clients).toHaveLength(1)
    expect(Store.getState().clients[0].active).toBe(false)
  })

  it('nurture sube health del cliente', () => {
    const client = ClientSystem.generateClient('smb')
    client.health = 50
    ClientSystem.signClient(client)
    ClientSystem.nurture(client.id, 20)
    expect(Store.getState().clients[0].health).toBe(70)
  })

  it('cliente hace churn si health llega al umbral', () => {
    const client = ClientSystem.generateClient('startup')
    ClientSystem.signClient(client)
    // Activar manualmente y bajar health al limite
    Store.dispatch({
      type: 'CLIENT_UPDATE',
      payload: { id: client.id, changes: { active: true, onboardingRemaining: 0, health: 31 } },
    })
    ClientSystem.processSprint()
    expect(Store.getState().clients).toHaveLength(0)
  })

  it('cliente se activa tras completar onboarding', () => {
    const client = ClientSystem.generateClient('startup')
    ClientSystem.signClient(client)
    Store.dispatch({
      type: 'CLIENT_UPDATE',
      payload: { id: client.id, changes: { onboardingRemaining: 1 } },
    })
    ClientSystem.processSprint()
    expect(Store.getState().clients[0].active).toBe(true)
  })
})

describe('FinanceSystem', () => {
  beforeEach(() => {
    Store.reset()
    EventBus.clear()
  })

  it('processSprint descuenta burn rate del cash', () => {
    Store.dispatch({ type: 'FINANCE_UPDATE', payload: { burnRate: 2000 } })
    FinanceSystem.processSprint()
    expect(Store.getState().finance.cash).toBeLessThan(50000)
  })

  it('processSprint suma ingresos del MRR', () => {
    Store.dispatch({ type: 'FINANCE_UPDATE', payload: { mrr: 10000, burnRate: 0 } })
    FinanceSystem.processSprint()
    expect(Store.getState().finance.cash).toBeGreaterThan(50000)
  })

  it('addInvestment suma cash correctamente', () => {
    FinanceSystem.addInvestment(100000, 'Serie Seed')
    expect(Store.getState().finance.cash).toBe(150000)
  })

  it('emite game.over si cash llega a 0', () => {
    let gameOver = false
    EventBus.on('game.over', () => { gameOver = true })
    Store.dispatch({ type: 'FINANCE_UPDATE', payload: { cash: 100, burnRate: 10000, mrr: 0 } })
    FinanceSystem.processSprint()
    expect(gameOver).toBe(true)
  })
})
