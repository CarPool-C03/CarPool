const PersistenzaService = require('../persistenza/PersistenzaService');
const ViaggioPrenotazioneService = require('../viaggiPrenotazioni/ViaggioPrenotazioneService');
const {
  ErroreValidazione,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
  ErroreConflitto,
} = require('../../comune/errori');

function erroreCampo(campo, messaggio) {
  return { campo, messaggio };
}

async function avviaValutazione(viaggioId, autoreId, valutatoId) {
  const viaggio = await PersistenzaService.viaggioPerValutazione(viaggioId);
  if (!viaggio) throw new ErroreNonTrovato('Viaggio non trovato');
  if (viaggio.stato !== 'Concluso') {
    throw new ErroreConflitto('VIAGGIO_NON_CONCLUSO', 'Il viaggio non è concluso');
  }
  if (!Number.isSafeInteger(valutatoId) || valutatoId < 1) {
    throw new ErroreValidazione([
      erroreCampo('valutatoId', 'Seleziona un partecipante valido'),
    ]);
  }
  const partecipa = await ViaggioPrenotazioneService.verificaPartecipazione(
    viaggioId,
    autoreId,
    valutatoId,
  );
  if (!partecipa) {
    throw new ErroreNonAutorizzato(
      'La valutazione è consentita solo tra partecipanti del viaggio',
      'NON_PARTECIPANTE',
    );
  }
  if (await PersistenzaService.esisteValutazione(autoreId, valutatoId, viaggioId)) {
    throw new ErroreConflitto(
      'VALUTAZIONE_GIA_INVIATA',
      'Hai già valutato questo partecipante per il viaggio',
    );
  }
}

function validaDati(punteggio, commento) {
  const errori = [];
  if (punteggio === undefined || punteggio === null || punteggio === '') {
    errori.push(erroreCampo('punteggio', 'Inserisci un punteggio da 1 a 5'));
  } else if (!Number.isInteger(punteggio) || punteggio < 1 || punteggio > 5) {
    errori.push(erroreCampo('punteggio', 'Inserisci un numero intero da 1 a 5'));
  }
  if (commento !== undefined && commento !== null && typeof commento !== 'string') {
    errori.push(erroreCampo('commento', 'Inserisci un commento testuale'));
  } else if (typeof commento === 'string' && commento.length > 500) {
    errori.push(erroreCampo('commento', 'Il commento non può superare 500 caratteri'));
  }
  if (errori.length) throw new ErroreValidazione(errori);
}

async function registraValutazione(autoreId, viaggioId, dati) {
  const valutatoId = dati.valutatoId;
  await avviaValutazione(viaggioId, autoreId, valutatoId);
  validaDati(dati.punteggio, dati.commento);

  const valutazione = await PersistenzaService.inserisciValutazione({
    autoreId,
    viaggioId,
    valutatoId,
    punteggio: dati.punteggio,
    commento: dati.commento ?? null,
  });
  if (!valutazione) {
    throw new ErroreConflitto(
      'VALUTAZIONE_GIA_INVIATA',
      'Hai già valutato questo partecipante per il viaggio',
    );
  }
  const ComunitaService = require('./ComunitaService');
  const mediaValutato = await ComunitaService.calcolaValutazioneMedia(valutatoId);
  return { ...valutazione, mediaValutato };
}

module.exports = { avviaValutazione, registraValutazione };
