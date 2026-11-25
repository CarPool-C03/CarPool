const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('../auth/fixture');

const ISTANTE_FISSATO = '2026-12-01T10:00:00+01:00';
const VEICOLO = {
  modello: 'Fiat Panda',
  colore: 'Bianco',
  numeroPostiPasseggeri: 4,
};

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

async function creaContesto({ veicolo = false } = {}) {
  const conducente = await creaAccount();
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id, nome`,
    [`Campus test ${randomUUID()}`, conducente.organizzazioneId],
  );
  const contesto = {
    conducente,
    cookie: await login(conducente),
    sede,
    sedi: [sede],
    account: [conducente],
  };
  if (veicolo) await aggiungiVeicolo(contesto);
  return contesto;
}

async function aggiungiVeicolo(contesto) {
  return PersistenzaService.inserisciVeicolo(contesto.conducente.membroId, VEICOLO);
}

async function aggiungiAccount(contesto, opzioni) {
  const account = await creaAccount(opzioni);
  contesto.account.push(account);
  return { ...account, cookie: await login(account) };
}

async function allineaOrganizzazione(account, organizzazioneId) {
  await PersistenzaService.query(
    'UPDATE "Membro" SET "organizzazioneId" = $1 WHERE id = $2',
    [organizzazioneId, account.membroId],
  );
}

function datiViaggio(sedeId, opzioni = {}) {
  return {
    dataOraPartenza: '2026-12-03T08:00:00+01:00',
    puntoPartenza: 'Salerno, Piazza della Concordia',
    sedeId,
    postiOfferti: 2,
    ...opzioni,
  };
}

async function pubblica(contesto, dati) {
  return request(creaApp())
    .post('/api/viaggi')
    .set('Cookie', contesto.cookie)
    .send(dati);
}

async function cerca(contesto, filtri = {}) {
  return request(creaApp())
    .get('/api/viaggi/ricerca')
    .set('Cookie', contesto.passeggero.cookie)
    .query({
      zona: 'Salerno',
      sedeId: contesto.sede.id,
      data: '2026-12-03',
      orarioMinimo: '08:00',
      ...filtri,
    });
}

async function contaViaggi(membroId) {
  const righe = await PersistenzaService.query(
    'SELECT id FROM "Viaggio" WHERE "conducenteId" = $1',
    [membroId],
  );
  return righe.length;
}

async function pulisciContesto(contesto) {
  if (!contesto) return;
  const membriId = contesto.account.map(({ membroId }) => membroId).filter(Boolean);
  if (membriId.length) {
    await PersistenzaService.query(
      `DELETE FROM "RichiestaPrenotazione" r
       USING "Viaggio" v
       WHERE r."viaggioId" = v.id
         AND v."conducenteId" = ANY($1::integer[])`,
      [membriId],
    );
    await PersistenzaService.query(
      'DELETE FROM "Viaggio" WHERE "conducenteId" = ANY($1::integer[])',
      [membriId],
    );
    await PersistenzaService.query(
      'DELETE FROM "Veicolo" WHERE "membroId" = ANY($1::integer[])',
      [membriId],
    );
  }
  const sediId = contesto.sedi.map(({ id }) => id);
  await PersistenzaService.query(
    'DELETE FROM "Sede" WHERE id = ANY($1::integer[])',
    [sediId],
  );
  for (const account of [...contesto.account].reverse()) await eliminaAccount(account);
}

module.exports = {
  VEICOLO,
  aggiungiAccount,
  aggiungiVeicolo,
  allineaOrganizzazione,
  cerca,
  contaViaggi,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
};
