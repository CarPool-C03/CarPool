// ViaggioPrenotazioneService: Facade del sottosistema viaggiPrenotazioni (docs/sdd/README.md, docs/odd/README.md).
const OrganizzazioneService = require('../organizzazioni/OrganizzazioneService');
const RicercaViaggi = require('./ricerca/RicercaViaggi');
const GestorePrenotazioni = require('./GestorePrenotazioni');
const GestoreViaggi = require('./GestoreViaggi');
const { ErroreValidazione, ErroreNonAutorizzato } = require('../../comune/errori');

function erroreCampo(campo, messaggio) {
  return { campo, messaggio };
}

function dataIsoValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

function orarioValido(orario) {
  return typeof orario === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(orario);
}

function dataOraEuropeRome(adesso) {
  const parti = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(adesso);
  const valore = (tipo) => parti.find((parte) => parte.type === tipo)?.value;
  return {
    data: `${valore('year')}-${valore('month')}-${valore('day')}`,
    orario: `${valore('hour')}:${valore('minute')}`,
  };
}

function validaFiltro(filtro, adesso = new Date()) {
  const errori = [];
  if (typeof filtro.zona !== 'string' || !filtro.zona.trim()) {
    errori.push(erroreCampo('zona', 'Inserisci una zona di partenza'));
  }
  if (!Number.isSafeInteger(filtro.sedeId) || filtro.sedeId <= 0) {
    errori.push(erroreCampo('sedeId', 'Seleziona una sede di destinazione'));
  }
  const dataValida = dataIsoValida(filtro.data);
  if (!dataValida) {
    errori.push(erroreCampo('data', 'Inserisci una data valida nel formato AAAA-MM-GG'));
  }
  const oraValida = orarioValido(filtro.orarioMinimo);
  if (!oraValida) {
    errori.push(erroreCampo('orarioMinimo', 'Inserisci un orario valido nel formato HH:MM'));
  }
  if (dataValida && oraValida) {
    const corrente = dataOraEuropeRome(adesso);
    if (filtro.data < corrente.data) {
      errori.push(erroreCampo('data', 'La data non può essere precedente a oggi'));
    } else if (filtro.data === corrente.data && filtro.orarioMinimo < corrente.orario) {
      errori.push(erroreCampo('orarioMinimo', 'L’orario minimo non può essere già trascorso'));
    }
  }
  if (errori.length) throw new ErroreValidazione(errori);
}

async function cercaViaggi(criterio, membroId, organizzazioneId) {
  if (
    !Number.isSafeInteger(membroId) ||
    !Number.isSafeInteger(organizzazioneId)
  ) {
    throw new ErroreNonAutorizzato('Contesto del Membro non valido');
  }

  const filtro = criterio.costruisciFiltro();
  validaFiltro(filtro);
  const sedi = await OrganizzazioneService.sediOrganizzazione(organizzazioneId);
  if (!sedi.some((sede) => sede.id === filtro.sedeId)) {
    throw new ErroreValidazione([
      erroreCampo('sedeId', 'Seleziona una sede della tua organizzazione'),
    ]);
  }
  return RicercaViaggi.cerca(criterio, membroId);
}

async function dettaglioViaggio(viaggioId, membroId) {
  return GestoreViaggi.dettaglioViaggio(viaggioId, membroId);
}

async function inviaRichiesta(membroId, viaggioId) {
  return GestorePrenotazioni.inviaRichiesta(membroId, viaggioId);
}

async function richiesteDelPasseggero(membroId) {
  return GestorePrenotazioni.richiesteDelPasseggero(membroId);
}

async function annullaRichiesta(membroId, richiestaId) {
  return GestorePrenotazioni.annullaRichiesta(membroId, richiestaId);
}

async function viaggiDelConducente(membroId) {
  return GestoreViaggi.viaggiDelConducente(membroId);
}

async function modificaViaggio(membroId, viaggioId, dati) {
  return GestoreViaggi.modificaViaggio(membroId, viaggioId, dati);
}

async function cancellaViaggio(membroId, viaggioId) {
  return GestoreViaggi.cancellaViaggio(membroId, viaggioId);
}

async function concludiViaggiScaduti(adesso) {
  return GestoreViaggi.concludiViaggiScaduti(adesso);
}

module.exports = {
  cercaViaggi,
  avviaPubblicazione: GestoreViaggi.avviaPubblicazione,
  pubblicaViaggio: GestoreViaggi.pubblica,
  dettaglioViaggio,
  inviaRichiesta,
  richiesteDelPasseggero,
  annullaRichiesta,
  viaggiDelConducente,
  modificaViaggio,
  cancellaViaggio,
  concludiViaggiScaduti,
};
