/**
 * HRSystem — Happiness decay, burnout, conflictos, 1:1s
 * Se ejecuta al inicio de cada sprint automáticamente
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import DeveloperSystem from './DeveloperSystem.js'
import TimeEngine from '../../core/TimeEngine.js'

const HAPPINESS_DECAY_PER_SPRINT = 3
const BURNOUT_THRESHOLD = 20
const QUIT_THRESHOLD = 0

const HRSystem = {
  /**
   * Corre al inicio de cada sprint — decae happiness y detecta problemas
   */
  processSprint() {
    const devs = DeveloperSystem.getAll()
    const events = []

    devs.forEach((dev) => {
      // Decay natural de happiness cada sprint
      const newHappiness = DeveloperSystem.updateHappiness(dev.id, -HAPPINESS_DECAY_PER_SPRINT)

      // Detectar burnout
      if (newHappiness <= BURNOUT_THRESHOLD && dev.happiness > BURNOUT_THRESHOLD) {
        events.push({ type: 'burnout', dev })
        EventBus.emit('hr.burnout.detected', { dev })
        console.warn(`?? [HRSystem] Burnout detectado: ${dev.name} (happiness: ${newHappiness})`)
      }

      // Dev renuncia si llega a 0
      if (newHappiness <= QUIT_THRESHOLD) {
        events.push({ type: 'quit', dev })
        DeveloperSystem.fire(dev.id)
        EventBus.emit('hr.dev.quit', { dev })
        console.warn(`?? [HRSystem] ${dev.name} renunció por burnout total`)
      }
    })

    // Detectar conflictos entre devs (probabilidad baja por sprint)
    if (devs.length >= 2 && Math.random() < 0.15) {
      const a = devs[Math.floor(Math.random() * devs.length)]
      const b = devs.filter((d) => d.id !== a.id)[Math.floor(Math.random() * (devs.length - 1))]
      if (a && b) {
        events.push({ type: 'conflict', devA: a, devB: b })
        EventBus.emit('hr.conflict.detected', { devA: a, devB: b })
        console.warn(`? [HRSystem] Conflicto detectado entre ${a.name} y ${b.name}`)
      }
    }

    return events
  },

  /**
   * Acción: hacer 1:1 con un dev — sube happiness y detecta problemas ocultos
   */
  doOneOnOne(devId) {
    const dev = DeveloperSystem.getById(devId)
    if (!dev) return false

    const happinessGain = 10 + Math.floor(Math.random() * 10)
    DeveloperSystem.updateHappiness(devId, happinessGain)

    // Chance de descubrir problema oculto
    if (Math.random() < 0.3) {
      EventBus.emit('hr.issue.discovered', { dev })
      console.log(`?? [HRSystem] 1:1 con ${dev.name} reveló un problema oculto`)
    }

    EventBus.emit('hr.oneonone.done', { dev, happinessGain })
    console.log(`? [HRSystem] 1:1 con ${dev.name} — happiness +${happinessGain}`)
    return happinessGain
  },

  /**
   * Acción: team building — sube happiness de todo el equipo
   */
  doTeamBuilding(cashAvailable) {
    const COST = 2000
    if (cashAvailable < COST) {
      console.warn('? [HRSystem] Sin cash para team building')
      return false
    }

    const devs = DeveloperSystem.getAll()
    devs.forEach((dev) => DeveloperSystem.updateHappiness(dev.id, 20))

    Store.dispatch({
      type: 'FINANCE_UPDATE',
      payload: { cash: cashAvailable - COST },
    })

    EventBus.emit('hr.teambuilding.done', { count: devs.length, cost: COST })
    console.log(`?? [HRSystem] Team building — ${devs.length} devs +20 happiness — costo $${COST}`)
    return true
  },

  /**
   * Resolver un conflicto entre dos devs
   */
  resolveConflict(devAId, devBId, approach) {
    const approaches = {
      mediate: { happinessA: 5, happinessB: 5, label: 'Mediación' },
      reassign: { happinessA: -5, happinessB: 10, label: 'Reasignar uno' },
      ignore: { happinessA: -10, happinessB: -10, label: 'Ignorar' },
    }

    const result = approaches[approach] || approaches.ignore
    DeveloperSystem.updateHappiness(devAId, result.happinessA)
    DeveloperSystem.updateHappiness(devBId, result.happinessB)

    EventBus.emit('hr.conflict.resolved', { devAId, devBId, approach: result.label })
    console.log(`?? [HRSystem] Conflicto resuelto via ${result.label}`)
    return result
  },

  printTeamStatus() {
    const stats = DeveloperSystem.getTeamStats()
    if (!stats) {
      console.log('?? Sin developers contratados')
      return
    }
    console.log(`
?? Estado del equipo
????????????????????
Headcount:    ${stats.count}
Avg Skill:    ${stats.avgSkill}/10
Avg Velocity: ${stats.avgVelocity}/10
Avg Happiness:${stats.avgHappiness}/100
Burn Rate:    $${stats.burnRate}/mes
En riesgo:    ${stats.atRisk.length > 0 ? stats.atRisk.join(', ') : 'Ninguno'}
????????????????????`)
  },
}

export default HRSystem
