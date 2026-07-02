/**
 * FinanceSystem — Runway, MRR, burn rate, game over
 */

import Store from '../../core/Store.js'
import EventBus from '../../core/EventBus.js'

const FinanceSystem = {
  /**
   * Procesa finanzas al final de cada sprint (2 semanas)
   */
  processSprint() {
    const state = Store.getState()
    const { cash, mrr, burnRate } = state.finance

    // Ingresos y gastos del sprint (mensual / 2)
    const income = Math.round(mrr / 2)
    const expenses = Math.round(burnRate / 2)
    const newCash = cash + income - expenses
    const runway = expenses > 0 ? Math.floor(newCash / expenses) : 999

    Store.dispatch({
      type: 'FINANCE_UPDATE',
      payload: { cash: newCash, runway },
    })

    EventBus.emit('finance.processed', { income, expenses, newCash, runway })

    // Advertencia de runway bajo
    if (runway <= 3 && runway > 0) {
      EventBus.emit('finance.runway.low', { runway })
      console.warn(`?? [Finance] Runway crítico: ${runway} sprint(s) restante(s)`)
    }

    // Game over
    if (newCash <= 0) {
      EventBus.emit('game.over', { reason: 'Sin cash — runway agotado' })
      console.error('?? [Finance] GAME OVER — Sin cash')
    }

    return { income, expenses, newCash, runway }
  },

  addInvestment(amount, source = 'Inversión externa') {
    const state = Store.getState()
    Store.dispatch({
      type: 'FINANCE_UPDATE',
      payload: { cash: state.finance.cash + amount },
    })
    EventBus.emit('finance.investment', { amount, source })
    console.log(`?? [Finance] +$${amount} de ${source}`)
  },

  printFinances() {
    const { cash, mrr, burnRate, runway } = Store.getState().finance
    const monthly = mrr - burnRate
    console.log(`
?? Finanzas
????????????????????
Cash:      $${cash}
MRR:       $${mrr}/mes
Burn Rate: $${burnRate}/mes
Margen:    $${monthly}/mes ${monthly >= 0 ? '??' : '??'}
Runway:    ${runway} sprint(s) ${runway <= 3 ? '??' : runway <= 6 ? '??' : '??'}
????????????????????`)
  },
}

export default FinanceSystem
