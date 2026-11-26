class EventoPrenotazione {
  constructor(tipo, richiestaId, viaggioId) {
    this.tipo = tipo;
    if (typeof richiestaId === 'object' && typeof viaggioId === 'object') {
      this.richiesta = richiestaId;
      this.viaggio = viaggioId;
      this.richiestaId = richiestaId.id;
      this.viaggioId = viaggioId.id;
      return;
    }
    this.richiestaId = richiestaId;
    this.viaggioId = viaggioId;
  }
}

module.exports = EventoPrenotazione;
