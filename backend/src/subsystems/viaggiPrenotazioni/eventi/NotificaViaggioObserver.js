const AccountService = require('../../account/AccountService');
const LogService = require('../../logging/LogService');

async function preparaNotifica(evento) {
  const passeggeroId = evento.richiesta?.passeggero?.id;
  const viaggio = evento.viaggio;
  if (!Number.isSafeInteger(passeggeroId) || !viaggio?.conducente || !viaggio.sede) {
    throw new Error('Dati incompleti per la notifica del viaggio');
  }

  const passeggero = await AccountService.profilo(passeggeroId);
  if (!passeggero?.email || !passeggero.nome || !passeggero.cognome) {
    throw new Error('Profilo del Passeggero non disponibile per la notifica');
  }

  return {
    email: passeggero.email,
    dati: {
      nomePasseggero: `${passeggero.nome} ${passeggero.cognome}`,
      nomeConducente: `${viaggio.conducente.nome} ${viaggio.conducente.cognome}`,
      puntoPartenza: viaggio.puntoPartenza,
      destinazione: viaggio.sede.nome,
      dataOraPartenza: viaggio.dataOraPartenza,
    },
  };
}

function registraErrorePreparazione(tipo) {
  LogService.registraErrore({
    codice: 'ERRORE_INTERNO',
    descrizione: `Preparazione della notifica ${tipo} non riuscita`,
    sottosistema: 'viaggiPrenotazioni',
  });
}

module.exports = { preparaNotifica, registraErrorePreparazione };
