class OsservatorePrenotazione {
  aggiorna(evento) {
    throw new Error(`aggiorna(evento) non implementato per ${evento?.tipo ?? 'evento'}`);
  }
}

module.exports = OsservatorePrenotazione;
