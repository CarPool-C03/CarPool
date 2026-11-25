// ComunitaService: Facade del sottosistema valutazioniMessaggi (docs/sdd/README.md, docs/odd/README.md).
const PersistenzaService = require('../persistenza/PersistenzaService');

async function calcolaValutazioneMedia(membroId) {
  return PersistenzaService.calcolaValutazioneMedia(membroId);
}

module.exports = { calcolaValutazioneMedia };
