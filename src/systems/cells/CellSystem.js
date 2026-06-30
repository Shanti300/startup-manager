/**
 * CellSystem — Crea células y asigna developers
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'
import catalog from '../../data/cells.catalog.json'

const CellSystem = {
  createCell(typeId) {
    const type = catalog.types.find((t) => t.id === typeId)
    if (!type) throw new Error(`Tipo de célula desconocido: ${typeId}`)

    const cell = {
      id: `cell_${typeId}_${Date.now().toString(36)}`,
      typeId,
      label: type.label,
      devIds: [],
      maturity: 1,
      techDebt: 0,
      throughput: 0,
    }

    Store.dispatch({ type: 'CELL_ADD', payload: cell })
    EventBus.emit('cell.created', { cell })
    return cell
  },

  assignDeveloper(cellId, devId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    const dev = state.developers.find((d) => d.id === devId)

    if (!cell) {
      EventBus.emit('cell.assign.rejected', { reason: `Célula no encontrada: ${cellId}` })
      return false
    }
    if (!dev) {
      EventBus.emit('cell.assign.rejected', { reason: `Developer no encontrado: ${devId}` })
      return false
    }

    Store.dispatch({
      type: 'DEVELOPER_UPDATE',
      payload: { id: devId, changes: { cellId } },
    })
    Store.dispatch({
      type: 'CELL_UPDATE',
      payload: { id: cellId, changes: { devIds: [...cell.devIds, devId] } },
    })

    EventBus.emit('cell.assigned', { cellId, devId })
    return true
  },

  getCellThroughput(cellId) {
    const state = Store.getState()
    const cell = state.cells.find((c) => c.id === cellId)
    if (!cell) return 0

    const devs = state.developers.filter((d) => cell.devIds.includes(d.id))
    return devs.reduce((sum, d) => sum + d.stats.velocity, 0)
  },
}

export default CellSystem
