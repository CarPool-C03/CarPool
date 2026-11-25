const { createHash } = require('node:crypto');
const AccountService = require('../subsystems/account/AccountService');
const PersistenzaService = require('../subsystems/persistenza/PersistenzaService');
const { ErroreNonAutenticato, ErroreNonAutorizzato } = require('../comune/errori');

const NOME_COOKIE = 'carpool_sessione';

function opzioniCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 60 * 1000,
  };
}

async function richiediAutenticazione(richiesta, risposta, next) {
  const token = richiesta.cookies?.[NOME_COOKIE];
  if (!token) throw new ErroreNonAutenticato('Sessione non valida');

  const hash = createHash('sha256').update(token).digest('hex');
  const sessione = await PersistenzaService.verificaSessione(hash, new Date());
  if (!sessione) throw new ErroreNonAutenticato('Sessione non valida');

  const utente = await AccountService.utenteCorrente(sessione.accountId);
  if (!utente) throw new ErroreNonAutenticato('Sessione non valida');
  richiesta.accountId = sessione.accountId;
  richiesta.tokenSessione = token;
  richiesta.utente = utente;
  risposta.cookie(NOME_COOKIE, token, opzioniCookie());
  next();
}

function richiediRuolo(...ruoli) {
  return (richiesta, _risposta, next) => {
    if (!richiesta.utente) throw new ErroreNonAutenticato('Sessione non valida');
    const ruolo = richiesta.utente.ruolo;
    const ammesso =
      ruoli.includes(ruolo) || (ruolo === 'MobilityManager' && ruoli.includes('Membro'));
    if (!ammesso) throw new ErroreNonAutorizzato('Ruolo non autorizzato');
    next();
  };
}

module.exports = { richiediAutenticazione, richiediRuolo, opzioniCookie };
