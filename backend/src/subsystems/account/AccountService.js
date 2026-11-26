const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const PersistenzaService = require('../persistenza/PersistenzaService');
const RegistraAccountControl = require('./RegistraAccountControl');
const { hashToken } = require('./tokenUtils');
const Membro = require('./Membro');
const GestioneProfiloControl = require('./GestioneProfiloControl');
const {
  ErroreValidazione,
  ErroreNonAutenticato,
  ErroreNonAutorizzato,
  ErroreNonTrovato,
  ErroreConflitto,
} = require('../../comune/errori');

const MESSAGGIO_CREDENZIALI = 'E-mail o password non valide';

async function utenteCorrente(accountId) {
  const account = await PersistenzaService.recuperaUtenteCorrente(accountId);
  if (!account) return null;

  const amministratore = account.tipoAccount === 'Amministratore';
  return {
    id: account.id,
    email: account.email,
    ruolo: amministratore
      ? 'Amministratore'
      : account.ruoloMobilityManager
        ? 'MobilityManager'
        : 'Membro',
    membro: account.membroId === null
      ? null
      : { id: account.membroId, nome: account.nome, cognome: account.cognome },
    organizzazione: account.organizzazioneId === null
      ? null
      : { id: account.organizzazioneId, denominazione: account.denominazione },
  };
}

async function accedi(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ErroreNonAutenticato(MESSAGGIO_CREDENZIALI, 'CREDENZIALI_NON_VALIDE');
  }
  const account = await PersistenzaService.trovaAccountPerEmail(email.trim().toLowerCase());
  const passwordValida =
    account && (await bcrypt.compare(password, account.passwordHash));
  if (!passwordValida) {
    throw new ErroreNonAutenticato(MESSAGGIO_CREDENZIALI, 'CREDENZIALI_NON_VALIDE');
  }
  if (account.stato !== 'Attivo') {
    throw new ErroreNonAutorizzato('Account non attivo', 'ACCOUNT_NON_ATTIVO');
  }

  const token = randomBytes(32).toString('hex');
  await PersistenzaService.creaSessione({
    accountId: account.id,
    hashToken: hashToken(token),
    ultimaAttivita: new Date(),
  });
  const utente = await utenteCorrente(account.id);
  if (!utente) throw new ErroreNonAutenticato('Account non attivo');
  return { token, utente };
}

async function esci(token) {
  await PersistenzaService.eliminaSessione(hashToken(token));
}

function registra(dati) {
  return RegistraAccountControl.registra(dati);
}

function verificaLink(token) {
  return RegistraAccountControl.verificaLink(token);
}

async function cercaMembri(email) {
  const termine = typeof email === 'string' ? email.trim() : '';
  if (termine.length < 3) {
    throw new ErroreValidazione([
      { campo: 'email', messaggio: 'Inserisci almeno 3 caratteri' },
    ]);
  }
  return PersistenzaService.cercaMembri(termine);
}

async function assegnaRuoloMobilityManager(membroId) {
  const dati = await PersistenzaService.membroPerAssegnazioneRuolo(membroId);
  if (!dati) throw new ErroreNonTrovato('Membro non trovato');
  if (dati.statoAccount !== 'Attivo') {
    throw new ErroreConflitto('ACCOUNT_NON_ATTIVO', 'L’account del Membro non è attivo');
  }
  const membro = new Membro(dati);
  membro.assegnaRuoloMobilityManager();
  const aggiornato = await PersistenzaService.assegnaRuoloMobilityManager(membro.id);
  if (!aggiornato) {
    const corrente = await PersistenzaService.membroPerAssegnazioneRuolo(membro.id);
    if (!corrente) throw new ErroreNonTrovato('Membro non trovato');
    throw new ErroreConflitto('ACCOUNT_NON_ATTIVO', 'L’account del Membro non è attivo');
  }
  return aggiornato;
}

async function profilo(membroId) {
  return GestioneProfiloControl.profilo(membroId);
}

async function registraVeicolo(membroId, dati) {
  return GestioneProfiloControl.registraVeicolo(membroId, dati);
}

async function eliminaAccount(accountId, password) {
  const account = await PersistenzaService.trovaAccountPerId(accountId);
  if (!account || account.stato !== 'Attivo') {
    throw new ErroreNonAutorizzato('Account non attivo', 'ACCOUNT_NON_ATTIVO');
  }
  const passwordValida =
    typeof password === 'string' && (await bcrypt.compare(password, account.passwordHash));
  if (!passwordValida) {
    throw new ErroreValidazione([
      { campo: 'password', messaggio: 'La password non è corretta' },
    ]);
  }
  await PersistenzaService.eliminaAccount(accountId);
}

module.exports = {
  accedi,
  esci,
  utenteCorrente,
  registra,
  verificaLink,
  cercaMembri,
  assegnaRuoloMobilityManager,
  profilo,
  registraVeicolo,
  eliminaAccount,
};
