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

async function creaSede(organizzazioneId, nome) {
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id, nome`,
    [nome, organizzazioneId],
  );
  return sede;
}

async function creaContestoReport() {
  const mobilityManager = await creaAccount();
  const membro = await creaAccount();
  const conducente = await creaAccount();
  await PersistenzaService.query(
    'UPDATE "Membro" SET "ruoloMobilityManager" = TRUE WHERE id = $1',
    [mobilityManager.membroId],
  );
  await PersistenzaService.query(
    'UPDATE "Membro" SET "organizzazioneId" = $1 WHERE id = ANY($2::integer[])',
    [mobilityManager.organizzazioneId, [membro.membroId, conducente.membroId]],
  );
  const sedeFisciano = await creaSede(mobilityManager.organizzazioneId, 'Campus di Fisciano');
  const sedeBaronissi = await creaSede(mobilityManager.organizzazioneId, 'Campus di Baronissi');
  return {
    mobilityManager,
    membro,
    conducente,
    accounts: [mobilityManager, membro, conducente],
    sedi: [sedeFisciano, sedeBaronissi],
    sedeFisciano,
    sedeBaronissi,
    cookieMobilityManager: await login(mobilityManager),
    cookieMembro: await login(membro),
  };
}

async function creaViaggio(contesto, {
  sede = contesto.sedeFisciano,
  partenza,
  postiOfferti,
} = {}) {
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
      ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
     VALUES ($1, 'Salerno, Via di prova', $2, 'Concluso', $3, $4)
     RETURNING id`,
    [partenza, postiOfferti, contesto.conducente.membroId, sede.id],
  );
  return viaggio.id;
}

async function creaRichiesteCompletate(contesto, viaggioId, numero) {
  const passeggeri = [contesto.mobilityManager.membroId, contesto.membro.membroId];
  for (const passeggeroId of passeggeri.slice(0, numero)) {
    await PersistenzaService.query(
      `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
       VALUES ('Completata', $1, $2)`,
      [passeggeroId, viaggioId],
    );
  }
}

async function report(contesto, sedeId, dal, al, cookie = contesto.cookieMobilityManager) {
  return request(creaApp())
    .get('/api/report')
    .set('Cookie', cookie)
    .query({ sedeId, dal, al });
}

async function aggiungiSedeAltraOrganizzazione(contesto) {
  const altraOrganizzazione = await creaAccount();
  const sede = await creaSede(altraOrganizzazione.organizzazioneId, `Sede ${randomUUID()}`);
  contesto.accounts.push(altraOrganizzazione);
  contesto.sedi.push(sede);
  return sede;
}

async function pulisciContesto(contesto) {
  const sediIds = contesto.sedi.map(({ id }) => id);
  await PersistenzaService.query(
    `DELETE FROM "RichiestaPrenotazione" r
     USING "Viaggio" v
     WHERE r."viaggioId" = v.id AND v."sedeId" = ANY($1::integer[])`,
    [sediIds],
  );
  await PersistenzaService.query(
    'DELETE FROM "Viaggio" WHERE "sedeId" = ANY($1::integer[])',
    [sediIds],
  );
  await PersistenzaService.query('DELETE FROM "Sede" WHERE id = ANY($1::integer[])', [sediIds]);
  for (const account of [...contesto.accounts].reverse()) await eliminaAccount(account);
}

module.exports = {
  aggiungiSedeAltraOrganizzazione,
  creaContestoReport,
  creaRichiesteCompletate,
  creaViaggio,
  fissaOrologio,
  pulisciContesto,
  report,
  ripristinaOrologio,
};
