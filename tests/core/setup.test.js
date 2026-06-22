import { describe, it, expect } from 'vitest'

describe('Fase 0 — Setup', () => {
  it('el entorno de tests funciona', () => {
    expect(1 + 1).toBe(2)
  })

  it('ES Modules funcionan correctamente', () => {
    const obj = { name: 'startup-manager', version: '0.1.0' }
    expect(obj.name).toBe('startup-manager')
  })
})
