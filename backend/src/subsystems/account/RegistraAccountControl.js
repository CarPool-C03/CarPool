const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const PersistenzaService = require('../persistenza/PersistenzaService');
const OrganizzazioneService = require('../organizzazioni/OrganizzazioneService');
const NotificaService = require('../notifiche/NotificaService');
const { ErroreValidazione } = require('../../comune/errori');
const { hashToken } = require('./tokenUtils');

const MESSAGGIO_REGISTRAZIONE =
  "Ti abbiamo inviato un link di verifica all'indirizzo indicato";
const SCADENZA_TOKEN_MS = 24 * 60 * 60 * 1000;

function validaDati(dati) {
  const valori = dati && typeof dati === 'object' ? dati : {};
  const errori = [];
  const nome = typeof valori.nome === 'string' ? valori.nome.trim() : '';
  const cognome = typeof valori.cognome === 'string' ? valori.cognome.trim() : '';
  const email = typeof valori.email === 'string' ? valori.email.trim().toLowerCase() : '';
  const password = typeof valori.password === 'string' ? valori.password : '';

  if (!nome || nome.length > 100) {
    errori.push({ campo: 'nome', messaggio: 'Inserisci un nome da 1 a 100 caratteri' });
  }
  if (!cognome || cognome.length > 100) {
    errori.push({ campo: 'cognome', messaggio: 'Inserisci un cognome da 1 a 100 caratteri' });
  }
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errori.push({ campo: 'email', messaggio: 'Inserisci un indirizzo e-mail valido' });
  }
  if (password.length < 8) {
    errori.push({ campo: 'password', messaggio: 'La password deve contenere almeno 8 caratteri' });
  }

  if (errori.length) throw new ErroreValidazione(errori);
  return { nome, cognome, email, password };
}

function erroreEmail(messaggio) {
  return new ErroreValidazione([{ campo: 'email', messaggio }]);
}

async function registra(dati) {
  const { nome, cognome, email, password } = validaDati(dati);

  if (await PersistenzaService.esisteAccountEmail(email)) {
    throw erroreEmail('E-mail già registrata');
  }

  const organizzazione = await OrganizzazioneService.riconosciDominio(email);
  if (!organizzazione) throw erroreEmail('Dominio non autorizzato');

  const passwordHash = await bcrypt.hash(password, 12);
  const token = randomBytes(32).toString('hex');
  const hashTokenVerifica = hashToken(token);
  const scadenza = new Date(Date.now() + SCADENZA_TOKEN_MS);
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const link = `${frontendUrl}/verifica?token=${encodeURIComponent(token)}`;

  try {
    await PersistenzaService.transazione(async (tx) => {
      const accountId = await PersistenzaService.creaAccount(tx, { email, passwordHash });
      await PersistenzaService.creaMembro(tx, {
        nome,
        cognome,
        accountId,
        organizzazioneId: organizzazione.id,
      });
      await PersistenzaService.creaTokenVerifica(tx, {
        hashToken: hashTokenVerifica,
        scadenza,
        accountId,
      });

      const invioAccettato = await NotificaService.inviaLinkVerifica(email, link);
      if (!invioAccettato) throw new Error('Il servizio e-mail non ha accettato il link di verifica');
    });
  } catch (errore) {
    if (errore?.code === '23505' && errore.constraint === 'Account_email_key') {
      throw erroreEmail('E-mail già registrata');
    }
    throw errore;
  }

  return { messaggio: MESSAGGIO_REGISTRAZIONE };
}

async function verificaLink(token) {
  if (typeof token !== 'string' || !token) {
    throw new ErroreValidazione([
      { campo: 'token', messaggio: 'Link di verifica non valido, scaduto o già utilizzato' },
    ]);
  }

  const attivato = await PersistenzaService.attivaAccountConTokenVerifica(
    hashToken(token),
    new Date(),
  );
  if (!attivato) {
    throw new ErroreValidazione([
      { campo: 'token', messaggio: 'Link di verifica non valido, scaduto o già utilizzato' },
    ]);
  }
  return { messaggio: 'Account attivato' };
}

module.exports = { registra, verificaLink };
