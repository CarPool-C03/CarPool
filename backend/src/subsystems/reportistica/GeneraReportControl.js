const PersistenzaService = require('../persistenza/PersistenzaService');
const { ErroreValidazione } = require('../../comune/errori');

const AVVISO_NESSUN_VIAGGIO = 'Nel periodo non risultano viaggi condivisi per la sede indicata';

function dataIsoValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

function dataOggiEuropeRome(adesso) {
  const parti = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(adesso);
  const valore = (tipo) => parti.find((parte) => parte.type === tipo)?.value;
  return `${valore('year')}-${valore('month')}-${valore('day')}`;
}

function aggiungiMesi(data, mesi) {
  const [anno, mese, giorno] = data.split('-').map(Number);
  const indiceMese = mese - 1 + mesi;
  const annoFinale = anno + Math.floor(indiceMese / 12);
  const meseFinale = indiceMese % 12;
  const ultimoGiorno = new Date(Date.UTC(annoFinale, meseFinale + 1, 0)).getUTCDate();
  return new Date(Date.UTC(annoFinale, meseFinale, Math.min(giorno, ultimoGiorno)))
    .toISOString()
    .slice(0, 10);
}

function validaPeriodo(dal, al, adesso = new Date()) {
  const errori = [];
  const dalValido = dataIsoValida(dal);
  const alValido = dataIsoValida(al);

  if (!dalValido) {
    errori.push({ campo: 'dal', messaggio: 'Inserisci una data valida nel formato AAAA-MM-GG' });
  }
  if (!alValido) {
    errori.push({ campo: 'al', messaggio: 'Inserisci una data valida nel formato AAAA-MM-GG' });
  }
  if (dalValido && alValido) {
    if (dal >= al) {
      errori.push({ campo: 'dal', messaggio: 'La data di inizio deve precedere la data di fine' });
    }
    if (al > dataOggiEuropeRome(adesso)) {
      errori.push({ campo: 'al', messaggio: 'La data di fine non può essere successiva a oggi' });
    }
    if (al > aggiungiMesi(dal, 12)) {
      errori.push({ campo: 'al', messaggio: 'Il periodo non può superare 12 mesi' });
    }
  }
  if (errori.length) throw new ErroreValidazione(errori);
}

async function generaReport(sede, dal, al) {
  validaPeriodo(dal, al);
  const aggregati = await PersistenzaService.recuperaReportPSCL(sede.id, dal, al);
  return {
    sede: { id: sede.id, nome: sede.nome },
    dal,
    al,
    totali: aggregati.totali,
    mesi: aggregati.mesi,
    avviso: aggregati.mesi.length === 0 ? AVVISO_NESSUN_VIAGGIO : null,
  };
}

module.exports = { generaReport, validaPeriodo };
