const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('../auth/fixture');

const ISTANTE_FISSATO = '2026-12-01T10:00:00+01:00';

function fissaOrologio() {
  jest.useFakeTimers({
    doNotFake: [
      'nextTick',
      'setImmediate',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'queueMicrotask',
      'performance',
    ],
  });
  jest.setSystemTime(new Date(ISTANTE_FISSATO));
}

function ripristinaOrologio() {
  jest.useRealTimers();
}

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

async function creaSede(organizzazioneId, nome = `Sede ${randomUUID()}`) {
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id, nome, indirizzo`,
    [nome, organizzazioneId],
  );
  return sede;
}

async function creaContestoRicerca() {
  const passeggero = await creaAccount();
  const conducente = await creaAccount();
  await PersistenzaService.query(
    'UPDATE "Membro" SET "organizzazioneId" = $1 WHERE id = $2',
    [passeggero.organizzazioneId, conducente.membroId],
  );
  const sede = await creaSede(passeggero.organizzazioneId, 'Campus di Fisciano');
  const cookie = await login(passeggero);
  return {
    passeggero,
    conducente,
    cookie,
    sede,
    account: [passeggero, conducente],
    sedi: [sede],
    viaggiId: [],
  };
}

async function aggiungiAccount(contesto) {
  const account = await creaAccount();
  contesto.account.push(account);
  return account;
}

async function aggiungiSede(contesto, organizzazioneId, nome) {
  const sede = await creaSede(organizzazioneId, nome);
  contesto.sedi.push(sede);
  return sede;
}

async function creaViaggio(contesto, opzioni = {}) {
  const {
    conducenteId = contesto.conducente.membroId,
    sedeId = contesto.sede.id,
    dataOraPartenza = '2026-12-03T08:00:00+01:00',
    puntoPartenza = 'Salerno, Piazza della Concordia',
    postiOfferti = 3,
    contributoIndicativoEuro = 3.5,
    stato = 'Attivo',
  } = opzioni;
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
      ("dataOraPartenza", "puntoPartenza", "postiOfferti", "contributoIndicativoEuro",
       stato, "conducenteId", "sedeId")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      dataOraPartenza,
      puntoPartenza,
      postiOfferti,
      contributoIndicativoEuro,
      stato,
      conducenteId,
      sedeId,
    ],
  );
  contesto.viaggiId.push(viaggio.id);
  return viaggio.id;
}

async function creaRichiesta(viaggioId, passeggeroId, stato = 'Accettata') {
  await PersistenzaService.query(
    `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
     VALUES ($1, $2, $3)`,
    [stato, passeggeroId, viaggioId],
  );
}

async function cerca(contesto, filtri = {}) {
  return request(creaApp())
    .get('/api/viaggi/ricerca')
    .set('Cookie', contesto.cookie)
    .query({
      zona: 'Salerno',
      sedeId: contesto.sede.id,
      data: '2026-12-03',
      orarioMinimo: '08:00',
      ...filtri,
    });
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
  for (const sede of contesto.sedi) {
    await PersistenzaService.query('DELETE FROM "Sede" WHERE id = $1', [sede.id]);
  }
  for (const account of [...contesto.account].reverse()) await eliminaAccount(account);
}

module.exports = {
  aggiungiAccount,
  aggiungiSede,
  cerca,
  creaContestoRicerca,
  creaRichiesta,
  creaViaggio,
  fissaOrologio,
  pulisciContesto,
  ripristinaOrologio,
};
