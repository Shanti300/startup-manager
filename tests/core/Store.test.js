import { describe, it, expect, beforeEach } from 'vitest'
import Store from '../../src/core/Store.js'

describe('Store', () => {
  beforeEach(() => Store.reset())

  it('tiene estado inicial correcto', () => {
    const state = Store.getState()
    expect(state.sprint.current).toBe(0)
    expect(state.finance.cash).toBe(50000)
    expect(state.developers).toEqual([])
  })

  it('dispatch META_SET actualiza el meta', () => {
    Store.dispatch({ type: 'META_SET', payload: { companyName: 'DevCorp' } })
    expect(Store.getState().meta.companyName).toBe('DevCorp')
  })

  it('dispatch DECISION_ENQUEUE encola una decision', () => {
    Store.dispatch({ type: 'DECISION_ENQUEUE', payload: { description: 'Contratar dev' } })
    const state = Store.getState()
    expect(state.sprint.decisionsQueue).toHaveLength(1)
    expect(state.sprint.decisionsRemaining).toBe(2)
  })

  it('no encola mas de 3 decisiones por sprint', () => {
    for (let i = 0; i < 5; i++) {
      Store.dispatch({ type: 'DECISION_ENQUEUE', payload: { description: `Decision ${i}` } })
    }
    expect(Store.getState().sprint.decisionsQueue).toHaveLength(3)
  })

  it('SPRINT_ADVANCE incrementa el sprint y resetea decisiones', () => {
    Store.dispatch({ type: 'DECISION_ENQUEUE', payload: { description: 'Test' } })
    Store.dispatch({ type: 'SPRINT_ADVANCE' })
    const state = Store.getState()
    expect(state.sprint.current).toBe(1)
    expect(state.sprint.decisionsRemaining).toBe(3)
    expect(state.sprint.decisionsQueue).toHaveLength(0)
  })

  it('subscribe notifica cambios de estado', () => {
    let notified = false
    Store.subscribe(() => { notified = true })
    Store.dispatch({ type: 'META_SET', payload: { companyName: 'Test' } })
    expect(notified).toBe(true)
  })

  it('getState retorna una copia, no la referencia', () => {
    const s1 = Store.getState()
    s1.finance.cash = 0
    expect(Store.getState().finance.cash).toBe(50000)
  })
})
