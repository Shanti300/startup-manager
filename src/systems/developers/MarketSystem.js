/**
 * MarketSystem — Pool de fichajes, rotación por sprint, headhunting
 */

import EventBus from '../../core/EventBus.js'
import { generateMarketPool, generateDeveloper } from './DeveloperGenerator.js'

const MarketSystem = {
  pool: [],
  headhuntedIds: new Set(),

  initPool(size = 10) {
    this.pool = generateMarketPool(size)
    EventBus.emit('market.refreshed', { count: this.pool.size })
    console.log(`?? [MarketSystem] Mercado inicializado con ${this.pool.length} developers`)
  },

  /**
   * Rota el mercado cada sprint: reemplaza 2-3 devs que "desaparecen"
   */
  rotate() {
    const exitCount = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < exitCount && this.pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * this.pool.length)
      this.pool.splice(idx, 1)
    }

    const enterCount = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < enterCount; i++) {
      this.pool.push(generateDeveloper())
    }

    EventBus.emit('market.rotated', { count: this.pool.length })
    console.log(`?? [MarketSystem] Mercado rotado — ${this.pool.length} disponibles`)
  },

  /**
   * Headhunting: pagar para revelar stats ocultos de un dev
   */
  headhunt(devId, cashAvailable) {
    const HEADHUNT_COST = 500
    if (cashAvailable < HEADHUNT_COST) {
      console.warn('? [MarketSystem] No hay suficiente cash para headhunting')
      return null
    }

    const dev = this.pool.find((d) => d.id === devId)
    if (!dev) return null

    this.headhuntedIds.add(devId)
    EventBus.emit('market.headhunted', { dev, cost: HEADHUNT_COST })
    console.log(`??? [MarketSystem] Headhunting de ${dev.name} — costo $${HEADHUNT_COST}`)
    return { dev, cost: HEADHUNT_COST }
  },

  isHeadhunted(devId) {
    return this.headhuntedIds.has(devId)
  },

  /**
   * Devuelve el pool con stats parcialmente ocultos (solo se ven completos si headhunted)
   */
  getVisiblePool() {
    return this.pool.map((dev) => {
      if (this.headhuntedIds.has(dev.id)) return dev
      return {
        ...dev,
        stats: {
          skill: '?',
          velocity: '?',
          collaboration: dev.stats.collaboration,
          adaptability: '?',
        },
      }
    })
  },

  removeFromPool(devId) {
    const idx = this.pool.findIndex((d) => d.id === devId)
    if (idx !== -1) this.pool.splice(idx, 1)
  },
}

export default MarketSystem
