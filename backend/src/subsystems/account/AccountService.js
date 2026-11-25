const bcrypt = require('bcryptjs');
const { createHash, randomBytes } = require('node:crypto');
const PersistenzaService = require('../persistenza/PersistenzaService');
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

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function utenteCorrente(accountId) {
  const righe = await PersistenzaService.query(
    `SELECT a.id, a.email, a."tipoAccount", m.id AS "membroId",
            m.nome, m.cognome, m."ruoloMobilityManager",
            o.id AS "organizzazioneId", o.denominazione
     FROM "Account" a
     LEFT JOIN "Membro" m ON m."accountId" = a.id
     LEFT JOIN "Organizzazione" o ON o.id = m."organizzazioneId"
     WHERE a.id = $1 AND a.stato = 'Attivo'`,
    [accountId],
  );
  const account = righe[0];
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
  const righe = await PersistenzaService.query(
    `SELECT id, "passwordHash", stato FROM "Account" WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  const account = righe[0];
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

module.exports = {
  accedi,
  esci,
  utenteCorrente,
  cercaMembri,
  assegnaRuoloMobilityManager,
  profilo,
  registraVeicolo,
};
