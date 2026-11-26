class EventiPrenotazione {
  constructor() {
    this.osservatori = [];
  }

  registra(osservatore) {
    this.osservatori.push(osservatore);
  }

  async pubblica(evento) {
    for (const osservatore of this.osservatori) {
      await osservatore.aggiorna(evento);
    }
  }
}

module.exports = EventiPrenotazione;
