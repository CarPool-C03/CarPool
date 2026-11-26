// ComunitaService: Facade del sottosistema valutazioniMessaggi (docs/sdd/README.md, docs/odd/README.md).
const PersistenzaService = require('../persistenza/PersistenzaService');

async function calcolaValutazioneMedia(membroId) {
  return PersistenzaService.calcolaValutazioneMedia(membroId);
}

async function registraValutazione(autoreId, viaggioId, dati) {
  const ValutaPartecipanteControl = require('./ValutaPartecipanteControl');
  return ValutaPartecipanteControl.registraValutazione(autoreId, viaggioId, dati);
}

async function valutazioniDaFare(membroId) {
  const righe = await PersistenzaService.valutazioniDaFare(membroId);
  const viaggi = new Map();
  for (const riga of righe) {
    if (!viaggi.has(riga.viaggioId)) {
      viaggi.set(riga.viaggioId, {
        viaggio: {
          id: riga.viaggioId,
          dataOraPartenza: riga.dataOraPartenza,
          sede: riga.sede,
        },
        persone: [],
      });
    }
    viaggi.get(riga.viaggioId).persone.push({
      membroId: riga.membroId,
      nome: riga.nome,
      cognome: riga.cognome,
      ruolo: riga.ruolo,
    });
  }
  return [...viaggi.values()];
}

module.exports = {
  calcolaValutazioneMedia,
  registraValutazione,
  valutazioniDaFare,
};
