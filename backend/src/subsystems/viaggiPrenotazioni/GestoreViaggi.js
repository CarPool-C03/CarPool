const AccountService = require('../account/AccountService');
const OrganizzazioneService = require('../organizzazioni/OrganizzazioneService');
const PersistenzaService = require('../persistenza/PersistenzaService');
const LogService = require('../logging/LogService');
const Viaggio = require('./Viaggio');
const validaDati = require('./validaDatiViaggio');
const { EventoPrenotazione, eventi } = require('./eventi');
const {
  ErroreConflitto,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
} = require('../../comune/errori');

async function profilo(membroId) {
  const dati = await AccountService.profilo(membroId);
  if (!dati) throw new ErroreNonTrovato('Membro non trovato');
  return dati;
}

async function avviaPubblicazione(membroId) {
  const dati = await profilo(membroId);
  if (!dati.veicolo) throw new ErroreConflitto('VEICOLO_ASSENTE', 'Per pubblicare un viaggio inserisci prima i dati del veicolo');
  const sedi = await OrganizzazioneService.sediOrganizzazione(dati.organizzazione.id);
  return {
    postiMassimi: dati.veicolo.numeroPostiPasseggeri,
    sedi: sedi.map(({ id, nome }) => ({ id, nome })),
  };
}

async function pubblica(membroId, dati) {
  const datiProfilo = await profilo(membroId);
  if (!datiProfilo.veicolo) throw new ErroreConflitto('VEICOLO_ASSENTE', 'Per pubblicare un viaggio inserisci prima i dati del veicolo');
  const sedi = await OrganizzazioneService.sediOrganizzazione(datiProfilo.organizzazione.id);
  const validati = validaDati(dati, datiProfilo.veicolo, sedi);
  const sede = sedi.find((item) => item.id === validati.sedeId);
  const viaggio = new Viaggio({
    dataOraPartenza: validati.istante,
    puntoPartenza: validati.punto,
    postiOfferti: validati.posti,
    contributoIndicativoEuro: validati.contributo,
  }, datiProfilo, sede);
  return PersistenzaService.inserisciViaggio({
    conducenteId: membroId,
    sedeId: sede.id,
    dataOraPartenza: viaggio.dataOraPartenza,
    puntoPartenza: viaggio.puntoPartenza,
    postiOfferti: viaggio.postiOfferti,
    contributoIndicativoEuro: viaggio.contributoIndicativoEuro,
  });
}

async function dettaglioViaggio(viaggioId, membroId) {
  if (!Number.isSafeInteger(viaggioId) || !Number.isSafeInteger(membroId)) throw new ErroreNonTrovato('Viaggio non trovato');
  const viaggio = await PersistenzaService.dettaglioViaggio(viaggioId, membroId);
  if (!viaggio) throw new ErroreNonTrovato('Viaggio non trovato');
  return viaggio;
}

function gestisciEsito(esito) {
  switch (esito) {
    case 'NON_TROVATO':
      throw new ErroreNonTrovato('Viaggio non trovato');
    case 'NON_PROPRIETARIO':
      throw new ErroreNonAutorizzato('Il viaggio non appartiene al Conducente');
    case 'NON_ATTIVO':
      throw new ErroreConflitto('VIAGGIO_NON_ATTIVO', 'Il viaggio non è attivo');
    case 'RICHIESTE_ACCETTATE':
      throw new ErroreConflitto(
        'VIAGGIO_CON_PRENOTAZIONI_ACCETTATE',
        'Il viaggio ha richieste accettate',
      );
    default:
      throw new Error(`Esito viaggio non riconosciuto: ${esito}`);
  }
}

function registraErroreEvento(tipo) {
  LogService.registraErrore({
    codice: 'ERRORE_INTERNO',
    descrizione: `Pubblicazione evento ${tipo} non riuscita dopo il commit`,
    sottosistema: 'viaggiPrenotazioni',
  });
}

async function pubblicaEventi(tipo, viaggio, richiesteIds) {
  for (const richiestaId of richiesteIds) {
    const richiesta = viaggio.richieste.find((elemento) => elemento.id === richiestaId);
    if (!richiesta) {
      registraErroreEvento(tipo);
      continue;
    }
    await eventi.pubblica(new EventoPrenotazione(tipo, richiesta, viaggio));
  }
}

async function viaggiDelConducente(membroId) {
  return PersistenzaService.recuperaViaggiDelConducente(membroId);
}

async function modificaViaggio(membroId, viaggioId, dati) {
  const datiProfilo = await profilo(membroId);
  if (!datiProfilo.veicolo) {
    throw new ErroreConflitto('VEICOLO_ASSENTE', 'Per modificare il viaggio è necessario un veicolo');
  }
  const sedi = await OrganizzazioneService.sediOrganizzazione(
    datiProfilo.organizzazione.id,
  );
  const validati = validaDati(dati, datiProfilo.veicolo, sedi);
  const risultato = await PersistenzaService.modificaViaggio(membroId, viaggioId, {
    dataOraPartenza: validati.istante,
    puntoPartenza: validati.punto,
    sedeId: validati.sedeId,
    postiOfferti: validati.posti,
    contributoIndicativoEuro: validati.contributo,
  });
  if (risultato.esito !== 'AGGIORNATO') gestisciEsito(risultato.esito);

  await pubblicaEventi(
    'ViaggioModificato',
    risultato.viaggio,
    risultato.richiesteInAttesaIds,
  );
  return risultato.viaggio;
}

async function cancellaViaggio(membroId, viaggioId) {
  const risultato = await PersistenzaService.cancellaViaggio(membroId, viaggioId);
  if (risultato.esito !== 'CANCELLATO') gestisciEsito(risultato.esito);
  await pubblicaEventi(
    'ViaggioCancellato',
    risultato.viaggio,
    risultato.richiesteAnnullateIds,
  );
}

module.exports = {
  avviaPubblicazione,
  pubblica,
  dettaglioViaggio,
  viaggiDelConducente,
  modificaViaggio,
  cancellaViaggio,
};
