class Viaggio {
  constructor(dati, conducente, sede) {
    this.dataOraPartenza = dati.dataOraPartenza;
    this.puntoPartenza = dati.puntoPartenza;
    this.postiOfferti = dati.postiOfferti;
    this.contributoIndicativoEuro = dati.contributoIndicativoEuro;
    this.stato = 'Attivo';
    this.conducente = conducente;
    this.sede = sede;
  }

  calcolaPostiDisponibili() {
    return this.postiOfferti;
  }

  isAttivo() {
    return this.stato === 'Attivo';
  }

  isConcluso() {
    return this.stato === 'Concluso';
  }

  concludi() {
    this.stato = 'Concluso';
  }

  cancella() {
    this.stato = 'Cancellato';
  }
}

module.exports = Viaggio;
