/**
 * Store � Estado global del juego
 * Todo el estado vive aqu�. Nadie muta el estado directamente.
 * Solo se modifica via dispatch(action).
 */

import EventBus from './EventBus.js'

const initialState = {
  meta: {
    version: '0.1.0',
    companyName: 'Mi Startup',
    foundedAt: null,
    playtime: 0,
  },
  sprint: {
    current: 0,
    decisionsRemaining: 3,
    decisionsQueue: [],
    history: [],
  },
  developers: [],
  cells: [],
  clients: [],
  finance: {
    cash: 50000,
    mrr: 0,
    burnRate: 0,
    runway: 0,
  },
  reputation: {
    tech: 50,
    employer: 50,
    commercial: 50,
  },
  pendingEffects: [],
  eventHistory: [],
  flags: {},
}

let state = structuredClone(initialState)
const subscribers = []

const Store = {
  getState() {
    return structuredClone(state)
  },

  dispatch(action) {
    const prev = structuredClone(state)
    state = reduce(state, action)
    subscribers.forEach((cb) => cb(state, prev))
    EventBus.emit('store.updated', { action, state: structuredClone(state) })
  },

  subscribe(callback) {
    subscribers.push(callback)
    return () => {
      const idx = subscribers.indexOf(callback)
      if (idx > -1) subscribers.splice(idx, 1)
    }
  },

  loadState(savedState) {
    state = structuredClone(savedState)
    EventBus.emit('store.loaded', { state: structuredClone(state) })
  },

  reset() {
    state = structuredClone(initialState)
    EventBus.emit('store.reset', {})
  },
}

function reduce(state, action) {
  switch (action.type) {
    case 'META_SET':
      return { ...state, meta: { ...state.meta, ...action.payload } }

    case 'SPRINT_ADVANCE':
      return {
        ...state,
        sprint: {
          ...state.sprint,
          current: state.sprint.current + 1,
          decisionsRemaining: 3,
          decisionsQueue: [],
        },
      }

    case 'DECISION_ENQUEUE':
      if (state.sprint.decisionsRemaining <= 0) return state
      return {
        ...state,
        sprint: {
          ...state.sprint,
          decisionsQueue: [...state.sprint.decisionsQueue, action.payload],
          decisionsRemaining: state.sprint.decisionsRemaining - 1,
        },
      }

    case 'FINANCE_UPDATE':
      return { ...state, finance: { ...state.finance, ...action.payload } }

    case 'REPUTATION_UPDATE':
      return { ...state, reputation: { ...state.reputation, ...action.payload } }

    case 'EFFECT_ENQUEUE':
      return {
        ...state,
        pendingEffects: [...state.pendingEffects, action.payload],
      }

    case 'EFFECTS_RESOLVE': {
      const now = state.sprint.current
      const due = state.pendingEffects.filter((e) => e.resolvesAt <= now)
      const pending = state.pendingEffects.filter((e) => e.resolvesAt > now)
      return { ...state, pendingEffects: pending, _resolvedEffects: due }
    }

    case 'DEVELOPER_ADD':
      return { ...state, developers: [...state.developers, action.payload] }

    case 'DEVELOPER_REMOVE':
      return {
        ...state,
        developers: state.developers.filter((d) => d.id !== action.payload.id),
      }
    case 'DEVELOPER_UPDATE':
      return {
        ...state,
        developers: state.developers.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.changes } : d
        ),
      }

    case 'CELL_UPDATE':
      return {
        ...state,
        cells: state.cells.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.changes } : c
        ),
      }
    case 'CLIENT_ADD':
      return { ...state, clients: [...state.clients, action.payload] }
      
    case 'CLIENT_UPDATE':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.changes } : c
        ),
      }
    case 'CLIENT_REMOVE':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload.id),
      }

    case 'CELL_ADD':
      return { ...state, cells: [...state.cells, action.payload] }

    case 'FLAG_SET':
      return { ...state, flags: { ...state.flags, [action.payload.key]: action.payload.value } }

    default:
      console.warn(`[Store] Acci�n desconocida: ${action.type}`)
      return state
  }
}

export default Store
