const PersistenzaService = require('../persistenza/PersistenzaService');
const { ErroreNonTrovato } = require('../../comune/errori');

async function dettaglioViaggio(viaggioId, membroId) {
  const viaggio = await PersistenzaService.dettaglioViaggio(viaggioId, membroId);
  if (!viaggio) throw new ErroreNonTrovato('Viaggio non trovato');
  return viaggio;
}

module.exports = { dettaglioViaggio };
