const EventoPrenotazione = require('./EventoPrenotazione');
const EventiPrenotazione = require('./EventiPrenotazione');
const NotificaModificaObserver = require('./NotificaModificaObserver');
const NotificaCancellazioneObserver = require('./NotificaCancellazioneObserver');

const eventi = new EventiPrenotazione();
eventi.registra(new NotificaModificaObserver());
eventi.registra(new NotificaCancellazioneObserver());

module.exports = { EventoPrenotazione, eventi };
