/**
 * EventBus — Sistema de comunicación entre módulos
 * Los sistemas nunca se llaman directamente, solo emiten y escuchan eventos.
 */

const listeners = {}

const EventBus = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(callback)
  },

  off(event, callback) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter((cb) => cb !== callback)
  },

  emit(event, payload = {}) {
    if (!listeners[event]) return
    listeners[event].forEach((cb) => cb(payload))
  },

  clear(event) {
    if (event) {
      delete listeners[event]
    } else {
      Object.keys(listeners).forEach((key) => delete listeners[key])
    }
  },
}

export default EventBus
