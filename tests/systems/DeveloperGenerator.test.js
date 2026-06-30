import { describe, it, expect, beforeEach } from 'vitest'
import { generateDeveloper, generateMarketPool } from '../../src/systems/developers/DeveloperGenerator.js'

describe('DeveloperGenerator', () => {
  it('genera un developer con todos los campos requeridos', () => {
    const dev = generateDeveloper()
    expect(dev).toHaveProperty('id')
    expect(dev).toHaveProperty('name')
    expect(dev).toHaveProperty('role')
    expect(dev).toHaveProperty('seniority')
    expect(dev).toHaveProperty('stats')
    expect(dev).toHaveProperty('salary')
    expect(dev).toHaveProperty('happiness')
  })

  it('los stats estan entre 1 y 10', () => {
    const dev = generateDeveloper()
    Object.values(dev.stats).forEach((stat) => {
      expect(stat).toBeGreaterThanOrEqual(1)
      expect(stat).toBeLessThanOrEqual(10)
    })
  })

  it('la felicidad inicial esta entre 80 y 100', () => {
    const dev = generateDeveloper()
    expect(dev.happiness).toBeGreaterThanOrEqual(80)
    expect(dev.happiness).toBeLessThanOrEqual(100)
  })

  it('genera un rol especifico si se pide', () => {
    const dev = generateDeveloper('frontend')
    expect(dev.role).toBe('frontend')
    expect(dev.roleLabel).toBe('Frontend Dev')
  })

  it('dos developers generados son distintos', () => {
    const d1 = generateDeveloper()
    const d2 = generateDeveloper()
    expect(d1.id).not.toBe(d2.id)
  })

  it('generateMarketPool genera el numero correcto de devs', () => {
    const pool = generateMarketPool(12)
    expect(pool).toHaveLength(12)
  })

  it('el pool contiene todos los roles al menos una vez', () => {
    const pool = generateMarketPool(12)
    const roles = pool.map((d) => d.role)
    expect(roles).toContain('frontend')
    expect(roles).toContain('backend')
    expect(roles).toContain('devops')
  })

  it('Staff es mas raro que Junior', () => {
    const sample = Array.from({ length: 200 }, () => generateDeveloper())
    const juniors = sample.filter((d) => d.seniority === 'Junior').length
    const staff = sample.filter((d) => d.seniority === 'Staff').length
    expect(juniors).toBeGreaterThan(staff)
  })
})
