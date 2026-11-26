const NotificaService = require('../../notifiche/NotificaService');
const {
  preparaNotifica,
  registraErrorePreparazione,
} = require('./NotificaViaggioObserver');

class NotificaModificaObserver {
  async aggiorna(evento) {
    if (evento.tipo !== 'ViaggioModificato') return;
    try {
      const { email, dati } = await preparaNotifica(evento);
      NotificaService.inviaNotificaModifica(email, dati);
    } catch {
      registraErrorePreparazione('RF_TRIP_18');
    }
  }
}

module.exports = NotificaModificaObserver;
