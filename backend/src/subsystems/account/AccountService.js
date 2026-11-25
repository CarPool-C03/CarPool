const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const PersistenzaService = require('../persistenza/PersistenzaService');
const RegistraAccountControl = require('./RegistraAccountControl');
const { hashToken } = require('./tokenUtils');
const { ErroreNonAutenticato, ErroreNonAutorizzato } = require('../../comune/errori');

const MESSAGGIO_CREDENZIALI = 'E-mail o password non valide';

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

function registra(dati) {
  return RegistraAccountControl.registra(dati);
}

function verificaLink(token) {
  return RegistraAccountControl.verificaLink(token);
}

module.exports = { accedi, esci, utenteCorrente, registra, verificaLink };
