const CriterioRicerca = require('./CriterioRicerca');

class RicercaPerSede extends CriterioRicerca {
  constructor(filtri) {
    super();
    this.filtri = filtri;
  }

  costruisciFiltro() {
    const sedeId =
      typeof this.filtri.sedeId === 'string' && /^\d+$/.test(this.filtri.sedeId)
        ? Number(this.filtri.sedeId)
        : this.filtri.sedeId;
    return {
      zona: typeof this.filtri.zona === 'string' ? this.filtri.zona.trim() : this.filtri.zona,
      sedeId,
      data: this.filtri.data,
      orarioMinimo: this.filtri.orarioMinimo,
    };
  }
}

module.exports = RicercaPerSede;
