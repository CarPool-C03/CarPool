const NotificaService = require('../../notifiche/NotificaService');
const {
  preparaNotifica,
  registraErrorePreparazione,
} = require('./NotificaViaggioObserver');

class NotificaCancellazioneObserver {
  async aggiorna(evento) {
    if (evento.tipo !== 'ViaggioCancellato') return;
    try {
      const { email, dati } = await preparaNotifica(evento);
      NotificaService.inviaNotificaCancellazione(email, dati);
    } catch {
      registraErrorePreparazione('RF_TRIP_16');
    }
  }
}

module.exports = NotificaCancellazioneObserver;
