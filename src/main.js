// Entry point — Startup Manager
// Fase 4 completa: jugable desde consola del navegador

import SprintSystem from './systems/sprint/SprintSystem.js'
import SaveSystem from './systems/SaveSystem.js'
import Store from './core/Store.js'
import GameEngine from './core/GameEngine.js'
import DeveloperSystem from './systems/developers/DeveloperSystem.js'
import HRSystem from './systems/developers/HRSystem.js'
import MarketSystem from './systems/developers/MarketSystem.js'
import CellSystem from './systems/cells/CellSystem.js'
import ClientSystem from './systems/clients/ClientSystem.js'
import PipelineSystem from './systems/clients/PipelineSystem.js'
import FinanceSystem from './systems/finance/FinanceSystem.js'
import TechDebtEngine from './systems/cells/TechDebtEngine.js'
import SynergyEngine from './systems/cells/SynergyEngine.js'

// Conectar sistemas al loop de sprint via EventBus
import EventBus from './core/EventBus.js'

EventBus.on('sprint.processing', () => {
  HRSystem.processSprint()
  CellSystem.processSprint()
  ClientSystem.processSprint()
  FinanceSystem.processSprint()
  MarketSystem.rotate()
  PipelineSystem.rotate()
})

// API global para jugar desde consola
window.game = {
  // --- Setup ---
  start(companyName = 'Mi Startup') {
    SprintSystem.startNewRun(companyName)
    MarketSystem.initPool(10)
    PipelineSystem.generateOpportunities(3)
  },

  // --- Sprint ---
  next() { SprintSystem.nextSprint() },

  // --- Developers ---
  market()          { MarketSystem.printVisiblePool?.() || console.table(MarketSystem.getVisiblePool()) },
  hire(devId, cellId) { SprintSystem.hireFromMarket(devId, cellId) },
  team()            { HRSystem.printTeamStatus() },
  oneOnOne(devId)   { HRSystem.doOneOnOne(devId) },
  teamBuilding()    { HRSystem.doTeamBuilding(Store.getState().finance.cash) },

  // --- Células ---
  cells()           { CellSystem.printCells() },
  newCell(typeId)   { CellSystem.createCell(typeId) },
  assign(cellId, devId) { CellSystem.assignDeveloper(cellId, devId) },
  payDebt(cellId)   { TechDebtEngine.payDebt(cellId) },
  synergies()       { SynergyEngine.printSynergies() },

  // --- Clientes ---
  pipeline()        { PipelineSystem.printOpportunities() },
  sign(oppId)       { PipelineSystem.closeDeal(oppId) },
  clients()         { ClientSystem.printClients() },
  nurture(clientId) { ClientSystem.nurture(clientId) },

  // --- Finanzas ---
  finances()        { FinanceSystem.printFinances() },
  invest(amount)    { FinanceSystem.addInvestment(amount) },

  // --- Save ---
  save()            { SaveSystem.exportSave() },
  load(file)        { SaveSystem.importSave(file) },

  // --- Status completo ---
  status() {
    SprintSystem.printStatus()
    HRSystem.printTeamStatus()
    CellSystem.printCells()
    ClientSystem.printClients()
    FinanceSystem.printFinances()
  },

  help() {
    console.log(`
?? STARTUP MANAGER — Comandos disponibles
????????????????????????????????????????
game.start("Nombre")     ? iniciar run
game.next()              ? avanzar sprint
game.status()            ? ver todo el estado
--- Developers --------------------------
game.market()            ? ver mercado de fichajes
game.hire(devId, cellId) ? contratar dev
game.team()              ? ver estado del equipo
game.oneOnOne(devId)     ? hacer 1:1 con un dev
game.teamBuilding()      ? team building ($2000)
--- Células -----------------------------
game.cells()             ? ver células
game.newCell(typeId)     ? crear célula (core/platform/data/security/dx)
game.assign(cellId, devId) ? asignar dev a célula
game.payDebt(cellId)     ? reducir deuda técnica
game.synergies()         ? ver sinergias activas
--- Clientes ----------------------------
game.pipeline()          ? ver oportunidades comerciales
game.sign(oppId)         ? cerrar un deal
game.clients()           ? ver clientes activos
game.nurture(clientId)   ? atender a un cliente
--- Finanzas ----------------------------
game.finances()          ? ver estado financiero
game.invest(amount)      ? agregar inversión
--- Save --------------------------------
game.save()              ? exportar partida .txt
????????????????????????????????????????`)
  },
}

window.store = Store

document.querySelector('#app').innerHTML = `
  <div style="font-family: monospace; padding: 2rem; max-width: 700px; color: #ccc; background: #0d0d0d; min-height: 100vh;">
    <h1 style="color: #00ff88;">?? Startup Manager</h1>
    <p style="color: #888;">Abre la consola del navegador (F12) para jugar</p>
    <pre style="background:#111;color:#00ff88;padding:1.5rem;border-radius:8px;font-size:13px;">
game.help()          ? ver todos los comandos
game.start("DevCorp") ? iniciar partida
    </pre>
    <p style="color:#555; font-size:12px;">v0.1.0 — Fase 4 completa</p>
  </div>
`

console.log('%c?? Startup Manager', 'font-size:20px;color:#00ff88;font-weight:bold')
console.log('Escribe game.help() para ver los comandos disponibles')
console.log('Escribe game.start("NombreDeTuStartup") para comenzar')
