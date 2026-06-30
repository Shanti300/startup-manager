/**
 * DeveloperGenerator — Genera devs proceduralmente
 * Cada run produce un pool distinto. Sin dos partidas iguales.
 */

import catalog from '../../data/developers.catalog.json'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return items[i]
  }
  return items[items.length - 1]
}

function statWithVariance(base, variance = 2) {
  return Math.min(10, Math.max(1, base + Math.floor((Math.random() - 0.5) * variance * 2)))
}

function generateSalary(seniority, role) {
  const base = { Junior: 2800, Mid: 4200, Senior: 6500, Staff: 9000 }
  const roleMultiplier = { techlead: 1.3, devops: 1.2, data: 1.15, backend: 1.1, fullstack: 1.05, frontend: 1.0, qa: 0.95 }
  const b = base[seniority] * (roleMultiplier[role] || 1)
  return Math.round(b + (Math.random() - 0.5) * b * 0.2)
}

export function generateDeveloper(roleOverride = null) {
  const roleKey = roleOverride || pick(Object.keys(catalog.roles))
  const role = catalog.roles[roleKey]
  const seniority = pickWeighted(catalog.seniorityLevels, catalog.seniorityWeights)

  const seniorityBonus = { Junior: 0, Mid: 1, Senior: 2, Staff: 3 }
  const bonus = seniorityBonus[seniority]

  return {
    id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${pick(catalog.firstNames)} ${pick(catalog.lastNames)}`,
    role: roleKey,
    roleLabel: role.label,
    seniority,
    skills: [pick(role.skills), pick(role.skills)].filter((v, i, a) => a.indexOf(v) === i),
    quirk: pick(role.quirks),
    stats: {
      skill:          statWithVariance(5 + bonus, 2),
      velocity:       statWithVariance(5 + bonus, 2),
      collaboration:  statWithVariance(5, 2),
      adaptability:   statWithVariance(5, 2),
    },
    happiness:  80 + Math.floor(Math.random() * 20),
    salary:     generateSalary(seniority, roleKey),
    cellId:     null,
    hiredAt:    null,
    available:  true,
  }
}

export function generateMarketPool(size = 12) {
  const roleKeys = Object.keys(catalog.roles)
  const guaranteed = roleKeys.map((role) => generateDeveloper(role))
  const extras = Array.from({ length: size - guaranteed.length }, () => generateDeveloper())
  return [...guaranteed, ...extras].sort(() => Math.random() - 0.5)
}
