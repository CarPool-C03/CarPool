const EventoPrenotazione = require('./EventoPrenotazione');
const EventiPrenotazione = require('./EventiPrenotazione');
const NotificaModificaObserver = require('./NotificaModificaObserver');
const NotificaCancellazioneObserver = require('./NotificaCancellazioneObserver');
const NotificaEsitoObserver = require('./NotificaEsitoObserver');

const eventi = new EventiPrenotazione();
eventi.registra(new NotificaModificaObserver());
eventi.registra(new NotificaCancellazioneObserver());

module.exports = { EventoPrenotazione, EventiPrenotazione, NotificaEsitoObserver, eventi };
