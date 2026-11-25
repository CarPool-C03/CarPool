const PersistenzaService = require('../persistenza/PersistenzaService');
const ComunitaService = require('../valutazioniMessaggi/ComunitaService');
const {
  ErroreValidazione,
  ErroreNonTrovato,
  ErroreConflitto,
} = require('../../comune/errori');

function validaVeicolo(dati) {
  const errori = [];
  const modello = typeof dati?.modello === 'string' ? dati.modello.trim() : '';
  const colore = typeof dati?.colore === 'string' ? dati.colore.trim() : '';
  const numeroPostiPasseggeri = dati?.numeroPostiPasseggeri;

  if (!modello || modello.length > 100) {
    errori.push({ campo: 'modello', messaggio: 'Inserisci un modello di 1–100 caratteri' });
  }
  if (!colore || colore.length > 50) {
    errori.push({ campo: 'colore', messaggio: 'Inserisci un colore di 1–50 caratteri' });
  }
  if (!Number.isInteger(numeroPostiPasseggeri) || numeroPostiPasseggeri < 1) {
    errori.push({
      campo: 'numeroPostiPasseggeri',
      messaggio: 'Inserisci un numero intero di posti passeggeri pari o superiore a 1',
    });
  }
  if (errori.length) throw new ErroreValidazione(errori);

  return { modello, colore, numeroPostiPasseggeri };
}

async function profilo(membroId) {
  const profiloMembro = await PersistenzaService.recuperaProfilo(membroId);
  if (!profiloMembro) throw new ErroreNonTrovato('Membro non trovato');
  profiloMembro.valutazioneMedia = await ComunitaService.calcolaValutazioneMedia(membroId);
  return profiloMembro;
}

async function registraVeicolo(membroId, dati) {
  const veicolo = await PersistenzaService.inserisciVeicolo(
    membroId,
    validaVeicolo(dati),
  );
  if (!veicolo) {
    throw new ErroreConflitto(
      'VEICOLO_GIA_PRESENTE',
      'È già presente un veicolo associato al profilo',
    );
  }
  return veicolo;
}

module.exports = { profilo, registraVeicolo };
