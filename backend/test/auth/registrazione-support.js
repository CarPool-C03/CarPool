jest.mock('../../src/subsystems/notifiche/NotificaService', () => ({
  inviaLinkVerifica: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const NotificaService = require('../../src/subsystems/notifiche/NotificaService');

const EMAIL = 'mario.rossi@studenti.unisa.it';
const PASSWORD = 'Password-di-test-47!';
const DATI_VALIDI = {
  nome: 'Mario',
  cognome: 'Rossi',
  email: EMAIL,
  password: PASSWORD,
};
const emailAggiuntiva = 'mario.rossi.usato@studenti.unisa.it';
let organizzazioneId;
let organizzazioneCreata;

async function preparaTest() {
  NotificaService.inviaLinkVerifica.mockReset().mockReturnValue(true);
  const [dominioEsistente] = await PersistenzaService.query(
    'SELECT "organizzazioneId" FROM "DominioEmail" WHERE dominio = $1',
    ['studenti.unisa.it'],
  );
  if (dominioEsistente) {
    organizzazioneId = dominioEsistente.organizzazioneId;
    organizzazioneCreata = false;
  } else {
    const [organizzazione] = await PersistenzaService.query(
      'INSERT INTO "Organizzazione" (denominazione) VALUES ($1) RETURNING id',
      ['Università degli Studi di Salerno'],
    );
    organizzazioneId = organizzazione.id;
    organizzazioneCreata = true;
    await PersistenzaService.query(
      'INSERT INTO "DominioEmail" (dominio, "organizzazioneId") VALUES ($1, $2)',
      ['studenti.unisa.it', organizzazioneId],
    );
  }
}

async function dopoTest() {
  await PersistenzaService.transazione(async (tx) => {
    for (const email of [EMAIL, emailAggiuntiva]) {
      const accounts = await tx.query('SELECT id FROM "Account" WHERE email = $1', [email]);
      for (const account of accounts) {
        await tx.query('DELETE FROM "TokenVerifica" WHERE "accountId" = $1', [account.id]);
        await tx.query('DELETE FROM "Membro" WHERE "accountId" = $1', [account.id]);
        await tx.query('DELETE FROM "Account" WHERE id = $1', [account.id]);
      }
    }

    if (organizzazioneCreata && organizzazioneId) {
      await tx.query('DELETE FROM "DominioEmail" WHERE "organizzazioneId" = $1', [
        organizzazioneId,
      ]);
      await tx.query('DELETE FROM "Organizzazione" WHERE id = $1', [organizzazioneId]);
    }
  });
}

async function contaAccount(email) {
  const [riga] = await PersistenzaService.query(
    'SELECT COUNT(*)::int AS quantita FROM "Account" WHERE email = $1',
    [email],
  );
  return riga.quantita;
}

async function creaAccountEsistente(email) {
  await PersistenzaService.transazione(async (tx) => {
    const [account] = await tx.query(
      'INSERT INTO "Account" (email, "passwordHash", "tipoAccount", stato) ' +
        'VALUES ($1, $2, $3, $4) RETURNING id',
      [email, await bcrypt.hash(PASSWORD, 4), 'Membro', 'Attivo'],
    );
    await tx.query(
      'INSERT INTO "Membro" (nome, cognome, "accountId", "organizzazioneId") ' +
        'VALUES ($1, $2, $3, $4)',
      ['Mario', 'Rossi', account.id, organizzazioneId],
    );
  });
}

async function tokenDalLink() {
  const chiamate = NotificaService.inviaLinkVerifica.mock.calls;
  const link = chiamate[chiamate.length - 1][1];
  return new URL(link, 'http://localhost').searchParams.get('token');
}

async function accountConOrganizzazione(email) {
  const [account] = await PersistenzaService.query(
    'SELECT a.id, a.stato, m."organizzazioneId", o.denominazione ' +
      'FROM "Account" a JOIN "Membro" m ON m."accountId" = a.id ' +
      'JOIN "Organizzazione" o ON o.id = m."organizzazioneId" WHERE a.email = $1',
    [email],
  );
  return account;
}

module.exports = {
  DATI_VALIDI,
  EMAIL,
  NotificaService,
  PASSWORD,
  PersistenzaService,
  accountConOrganizzazione,
  contaAccount,
  creaAccountEsistente,
  creaApp,
  dopoTest,
  preparaTest,
  tokenDalLink,
};
