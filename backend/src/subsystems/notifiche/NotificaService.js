const fs = require('node:fs');
const path = require('node:path');
const LogService = require('../logging/LogService');
const BrevoAdapter = require('./BrevoAdapter');
const ConsoleEmailAdapter = require('./ConsoleEmailAdapter');

const modelli = {
  verificaAccount: fs.readFileSync(path.join(__dirname, 'modelli', 'verificaAccount.html'), 'utf8'),
  esitoPrenotazione: fs.readFileSync(
    path.join(__dirname, 'modelli', 'esitoPrenotazione.html'),
    'utf8',
  ),
};

function creaProviderEmail(provider) {
  if (provider === 'console') return new ConsoleEmailAdapter();
  if (provider === 'brevo') return new BrevoAdapter();
  throw new Error('EMAIL_PROVIDER deve essere "console" oppure "brevo"');
}

const providerEmail = creaProviderEmail(process.env.EMAIL_PROVIDER || 'console');

function escapeHtml(valore) {
  return String(valore).replace(/[&<>"']/g, (carattere) => {
    const caratteri = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return caratteri[carattere];
  });
}

function applicaModello(modello, valori) {
  return modello.replace(/{{(\w+)}}/g, (_segnaposto, chiave) => escapeHtml(valori[chiave]));
}

function formattaDataOra(dataOraPartenza) {
  const data = new Date(dataOraPartenza);
  if (Number.isNaN(data.getTime())) {
    throw new TypeError('dataOraPartenza deve essere una data ISO 8601 valida');
  }

  const parti = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valori = Object.fromEntries(parti.map(({ type, value }) => [type, value]));
  return `${valori.day}/${valori.month}/${valori.year} ${valori.hour}:${valori.minute}`;
}

function registraFallimento(tipo, errore) {
  const motivo = errore instanceof Error ? errore.message : String(errore);
  const descrizione = `${tipo}: ${motivo.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    '[indirizzo omesso]',
  )}`;
  LogService.registraErrore({
    codice: 'INVIO_EMAIL_FALLITO',
    descrizione,
    sottosistema: 'notifiche',
  });
}

function inoltra(messaggio, tipo) {
  let risultato;
  try {
    risultato = providerEmail.invia(messaggio);
  } catch (errore) {
    registraFallimento(tipo, errore);
    return false;
  }

  if (risultato && typeof risultato.then === 'function') {
    Promise.resolve(risultato).then(
      (accettato) => {
        if (!accettato) registraFallimento(tipo, 'il provider ha rifiutato l’invio');
      },
      (errore) => registraFallimento(tipo, errore),
    );
    return true;
  }

  if (!risultato) {
    registraFallimento(tipo, 'il provider ha rifiutato l’invio');
    return false;
  }
  return true;
}

function inviaLinkVerifica(email, link) {
  const html = applicaModello(modelli.verificaAccount, { link });
  return inoltra(
    { destinatario: email, oggetto: 'Verifica il tuo account CarPool', html },
    'verificaAccount',
  );
}

function inviaEsitoPrenotazione(email, dati, esito) {
  if (!['Accettata', 'Rifiutata'].includes(esito)) {
    throw new TypeError('esito deve essere "Accettata" oppure "Rifiutata"');
  }
  if (!dati || typeof dati !== 'object') {
    throw new TypeError('dati deve contenere i dettagli della prenotazione');
  }

  const oggetto = `Richiesta di prenotazione ${esito.toLowerCase()}`;
  const html = applicaModello(modelli.esitoPrenotazione, {
    nomePasseggero: dati.nomePasseggero,
    nomeConducente: dati.nomeConducente,
    puntoPartenza: dati.puntoPartenza,
    destinazione: dati.destinazione,
    dataOraPartenza: formattaDataOra(dati.dataOraPartenza),
    esito: esito.toLowerCase(),
  });
  return inoltra({ destinatario: email, oggetto, html }, 'esitoPrenotazione');
}

module.exports = { inviaLinkVerifica, inviaEsitoPrenotazione };
