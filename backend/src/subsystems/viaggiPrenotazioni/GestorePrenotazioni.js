const PersistenzaService = require('../persistenza/PersistenzaService');
const { ErroreConflitto, ErroreNonAutorizzato, ErroreNonTrovato } = require('../../comune/errori');

function erroreOperazione(codice) {
  switch (codice) {
    case 'VIAGGIO_NON_TROVATO':
      return new ErroreNonTrovato('Viaggio non trovato');
    case 'VIAGGIO_PROPRIO':
      return new ErroreConflitto(codice, 'Non puoi richiedere un posto per un tuo viaggio');
    case 'VIAGGIO_NON_ATTIVO':
      return new ErroreConflitto(codice, 'Il viaggio non è attivo');
    case 'RICHIESTA_GIA_PRESENTE':
      return new ErroreConflitto(codice, 'Hai già una richiesta attiva per questo viaggio');
    case 'RICHIESTA_NON_TROVATA':
      return new ErroreNonTrovato('Richiesta non trovata');
    case 'NON_AUTORIZZATO':
      return new ErroreNonAutorizzato('La richiesta non appartiene al Passeggero');
    case 'RICHIESTA_NON_ANNULLABILE':
      return new ErroreConflitto(codice, 'La richiesta non può essere annullata');
    case 'VIAGGIO_CONCLUSO':
      return new ErroreConflitto(codice, 'Il viaggio è concluso');
    default:
      throw new Error(`Esito richiesta non riconosciuto: ${codice}`);
  }
}

async function inviaRichiesta(membroId, viaggioId) {
  const risultato = await PersistenzaService.creaRichiesta(
    membroId,
    viaggioId,
  );
  if (risultato.errore) throw erroreOperazione(risultato.errore);
  return risultato.richiesta;
}

async function richiesteDelPasseggero(membroId) {
  return PersistenzaService.richiesteDelPasseggero(membroId);
}

async function annullaRichiesta(membroId, richiestaId) {
  const risultato = await PersistenzaService.annullaRichiesta(membroId, richiestaId);
  if (risultato.errore) throw erroreOperazione(risultato.errore);
  return risultato.richiesta;
}

module.exports = { inviaRichiesta, richiesteDelPasseggero, annullaRichiesta };
