/**
 * SaveSystem — Guarda y carga el estado del juego como .txt
 * El archivo es JSON legible. Se puede pasar a Claude para continuar un run.
 */

import Store from '../core/Store.js'

const AUTOSAVE_KEY = 'startup_manager_autosave'

const SaveSystem = {
  /**
   * Exporta el estado actual como archivo .txt descargable
   */
  exportSave() {
    const state = Store.getState()
    const saveData = {
      meta: {
        savedAt: new Date().toISOString(),
        sprintNumber: state.sprint.current,
        companyName: state.meta.companyName,
        version: state.meta.version,
      },
      state,
    }

    const json = JSON.stringify(saveData, null, 2)
    const blob = new Blob([json], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `startup_save_sprint${state.sprint.current}_${state.meta.companyName.replace(/\s+/g, '_')}.txt`
    a.click()

    URL.revokeObjectURL(url)
    this.autosave()

    console.log(`?? [SaveSystem] Partida exportada — Sprint ${state.sprint.current}`)
  },

  /**
   * Carga un archivo .txt y restaura el estado
   */
  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result)

          if (!saveData.state || !saveData.meta) {
            throw new Error('Archivo de guardado inválido o corrupto')
          }

          if (saveData.meta.version !== '0.1.0') {
            console.warn('[SaveSystem] Versión distinta — puede haber incompatibilidades')
          }

          Store.loadState(saveData.state)
          console.log(`?? [SaveSystem] Partida cargada — Sprint ${saveData.meta.sprintNumber} — ${saveData.meta.companyName}`)
          resolve(saveData.meta)
        } catch (err) {
          reject(new Error(`Error al cargar: ${err.message}`))
        }
      }

      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsText(file)
    })
  },

  /**
   * Guarda automáticamente en localStorage cada sprint
   */
  autosave() {
    const state = Store.getState()
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      state,
    }))
  },

  /**
   * Recupera el autosave del localStorage
   */
  loadAutosave() {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null

    try {
      const data = JSON.parse(raw)
      Store.loadState(data.state)
      console.log(`?? [SaveSystem] Autosave recuperado — Sprint ${data.state.sprint.current}`)
      return data
    } catch {
      console.warn('[SaveSystem] Autosave corrupto, ignorando')
      return null
    }
  },

  hasAutosave() {
    return !!localStorage.getItem(AUTOSAVE_KEY)
  },

  clearAutosave() {
    localStorage.removeItem(AUTOSAVE_KEY)
  },
}

export default SaveSystem
