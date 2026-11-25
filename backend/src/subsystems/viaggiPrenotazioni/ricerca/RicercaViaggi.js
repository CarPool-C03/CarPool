const PersistenzaService = require('../../persistenza/PersistenzaService');

class RicercaViaggi {
  static async cerca(criterio, membroId) {
    return PersistenzaService.cercaViaggi(criterio.costruisciFiltro(), membroId);
  }
}

module.exports = RicercaViaggi;
