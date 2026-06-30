// Entry point — Startup Manager
// Fase 1: jugable desde la consola del navegador

import SprintSystem from './systems/sprint/SprintSystem.js'
import SaveSystem from './systems/SaveSystem.js'
import Store from './core/Store.js'

// Exponer globalmente para jugar desde la consola del navegador
window.game = SprintSystem
window.save = SaveSystem
window.store = Store

document.querySelector('#app').innerHTML = `
  <div style="font-family: monospace; padding: 2rem; max-width: 700px;">
    <h1>?? Startup Manager</h1>
    <p style="color: green;">? Fase 1 — Jugable desde consola</p>
    <p>Abre la consola del navegador (F12) y ejecuta:</p>
    <pre style="background:#111;color:#0f0;padding:1rem;border-radius:6px;">
game.startNewRun("Mi Startup")
game.marketPool          // ver mercado de fichajes
game.hireFromMarket(id, cellId)
game.nextSprint()
save.exportSave()        // descarga .txt
    </pre>
  </div>
`

console.log('?? Startup Manager listo. Usa window.game para jugar desde la consola.')
