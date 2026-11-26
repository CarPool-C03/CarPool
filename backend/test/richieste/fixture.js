const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  PASSWORD,
  creaAccount,
  eliminaAccount,
} = require('../auth/fixture');

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

async function impostaIdentita(account, { nome, cognome }) {
  await PersistenzaService.query(
    'UPDATE "Membro" SET nome = $1, cognome = $2 WHERE id = $3',
    [nome, cognome, account.membroId],
  );
}

async function creaContesto() {
  const passeggero = await creaAccount();
  const conducente = await creaAccount();
  const altroPasseggero = await creaAccount();
  await impostaIdentita(passeggero, {
    nome: 'Anna',
    cognome: 'Bianchi',
  });
  await impostaIdentita(conducente, {
    nome: 'Luca',
    cognome: 'Verdi',
  });
  await impostaIdentita(altroPasseggero, {
    nome: 'Marco',
    cognome: 'Russo',
  });
  for (const account of [conducente, altroPasseggero]) {
    await PersistenzaService.query(
      'UPDATE "Membro" SET "organizzazioneId" = $1 WHERE id = $2',
      [passeggero.organizzazioneId, account.membroId],
    );
  }
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id, nome`,
    ['Campus di Fisciano', passeggero.organizzazioneId],
  );
  return {
    passeggero,
    conducente,
    altroPasseggero,
    cookie: await login(passeggero),
    cookieAltroPasseggero: await login(altroPasseggero),
    cookieConducente: await login(conducente),
    sede,
    viaggiId: [],
    accounts: [passeggero, conducente, altroPasseggero],
  };
}

async function aggiungiPasseggero(contesto) {
  const account = await creaAccount();
  await PersistenzaService.query(
    'UPDATE "Membro" SET "organizzazioneId" = $1 WHERE id = $2',
    [contesto.passeggero.organizzazioneId, account.membroId],
  );
  contesto.accounts.push(account);
  return account;
}

async function creaViaggio(contesto, opzioni = {}) {
  const {
    conducenteId = contesto.conducente.membroId,
    dataOraPartenza = '2026-12-03T08:00:00+01:00',
    postiOfferti = 3,
    stato = 'Attivo',
  } = opzioni;
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
      ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
     VALUES ($1, 'Salerno, Piazza della Concordia', $2, $3, $4, $5) RETURNING id`,
    [dataOraPartenza, postiOfferti, stato, conducenteId, contesto.sede.id],
  );
  contesto.viaggiId.push(viaggio.id);
  return viaggio.id;
}

async function creaRichiesta(viaggioId, passeggeroId, stato = 'InAttesa') {
  const [richiesta] = await PersistenzaService.query(
    `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
     VALUES ($1, $2, $3) RETURNING id`,
    [stato, passeggeroId, viaggioId],
  );
  return richiesta.id;
}

async function pulisciContesto(contesto) {
  if (contesto.viaggiId.length) {
    await PersistenzaService.query(
      'DELETE FROM "RichiestaPrenotazione" WHERE "viaggioId" = ANY($1::integer[])',
      [contesto.viaggiId],
    );
    await PersistenzaService.query(
      'DELETE FROM "Viaggio" WHERE id = ANY($1::integer[])',
      [contesto.viaggiId],
    );
  }
  await PersistenzaService.query('DELETE FROM "Sede" WHERE id = $1', [contesto.sede.id]);
  for (const account of [...contesto.accounts].reverse()) await eliminaAccount(account);
}

module.exports = {
  creaContesto,
  creaRichiesta,
  creaViaggio,
  aggiungiPasseggero,
  pulisciContesto,
};
