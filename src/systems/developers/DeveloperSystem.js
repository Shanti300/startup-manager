/**
 * DeveloperSystem — CRUD de developers, stats y happiness
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import TimeEngine from '../../core/TimeEngine.js'

const DeveloperSystem = {
  getAll() {
    return Store.getState().developers
  },

  getById(devId) {
    return Store.getState().developers.find((d) => d.id === devId) || null
  },

  hire(dev, cellId = null) {
    const state = Store.getState()
    dev.hiredAt = state.sprint.current
    dev.available = false
    dev.cellId = cellId

    Store.dispatch({ type: 'DEVELOPER_ADD', payload: dev })
    Store.dispatch({
      type: 'FINANCE_UPDATE',
      payload: { burnRate: state.finance.burnRate + dev.salary },
    })

    EventBus.emit('developer.hired', { dev, cellId })

    // Tarda 1 sprint en adaptarse
    TimeEngine.scheduleEffect({
      description: `${dev.name} ya está adaptado al equipo`,
      action: {
        type: 'DEVELOPER_UPDATE',
        payload: { id: dev.id, changes: { adapted: true } },
      },
    }, 1)

    console.log(`? [DeveloperSystem] Contratado: ${dev.name} (${dev.seniority} ${dev.roleLabel}) — $${dev.salary}/mes`)
    return dev
  },

  fire(devId) {
    const state = Store.getState()
    const dev = state.developers.find((d) => d.id === devId)
    if (!dev) return false

    Store.dispatch({ type: 'DEVELOPER_REMOVE', payload: { id: devId } })
    Store.dispatch({
      type: 'FINANCE_UPDATE',
      payload: { burnRate: Math.max(0, state.finance.burnRate - dev.salary) },
    })

    // Impacto en moral del equipo
    TimeEngine.scheduleEffect({
      description: `El equipo procesó la salida de ${dev.name}`,
      action: { type: 'FLAG_SET', payload: { key: `fired_${devId}`, value: true } },
    }, 1)

    EventBus.emit('developer.fired', { dev })
    console.log(`?? [DeveloperSystem] ${dev.name} salió de la empresa`)
    return true
  },

  updateStat(devId, stat, delta) {
    const dev = this.getById(devId)
    if (!dev) return false

    const current = dev.stats[stat]
    if (current === undefined) return false

    const newVal = Math.min(10, Math.max(1, current + delta))
    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: devId, changes: { stats: { ...dev.stats, [stat]: newVal } } },
    })

    EventBus.emit('developer.stat.updated', { devId, stat, delta, newVal })
    return true
  },

  updateHappiness(devId, delta) {
    const dev = this.getById(devId)
    if (!dev) return false

    const newHappiness = Math.min(100, Math.max(0, dev.happiness + delta))
    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: devId, changes: { happiness: newHappiness } },
    })

    if (newHappiness <= 20 && dev.happiness > 20) {
      EventBus.emit('developer.unhappy', { dev, happiness: newHappiness })
    }
    if (newHappiness === 0) {
      EventBus.emit('developer.quit', { dev })
    }

    return newHappiness
  },

  getTeamStats() {
    const devs = this.getAll()
    if (devs.length === 0) return null

    const avg = (key) => Math.round(devs.reduce((s, d) => s + d.stats[key], 0) / devs.length)
    const avgHappiness = Math.round(devs.reduce((s, d) => s + d.happiness, 0) / devs.length)
    const burnRate = devs.reduce((s, d) => s + d.salary, 0)

    return {
      count: devs.length,
      avgSkill: avg('skill'),
      avgVelocity: avg('velocity'),
      avgCollaboration: avg('collaboration'),
      avgAdaptability: avg('adaptability'),
      avgHappiness,
      burnRate,
      atRisk: devs.filter((d) => d.happiness <= 30).map((d) => d.name),
    }
  },
}

export default DeveloperSystem
