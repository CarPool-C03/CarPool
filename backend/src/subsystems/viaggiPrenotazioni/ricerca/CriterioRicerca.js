class CriterioRicerca {
  costruisciFiltro() {
    throw new Error('costruisciFiltro deve essere implementato dal criterio concreto');
  }
}

module.exports = CriterioRicerca;
