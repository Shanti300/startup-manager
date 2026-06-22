// Entry point — Startup Manager
// Fase 0: verifica que el entorno funciona

console.log('?? Startup Manager — Engine iniciando...')

document.querySelector('#app').innerHTML = `
  <div style="font-family: monospace; padding: 2rem;">
    <h1>?? Startup Manager</h1>
    <p style="color: green;">? Entorno listo — Fase 0 completada</p>
    <p>Sprint actual: <strong>0</strong></p>
    <p>Próximo paso: Core Engine (EventBus, Store, GameEngine)</p>
  </div>
`
