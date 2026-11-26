class EventiPrenotazione {
  constructor() {
    this.osservatori = [];
  }

  registra(osservatore) {
    this.osservatori.push(osservatore);
  }

  async notifica(evento) {
    for (const osservatore of this.osservatori) {
      await osservatore.aggiorna(evento);
    }
  }

  pubblica(evento) {
    return this.notifica(evento);
  }
}

module.exports = EventiPrenotazione;
