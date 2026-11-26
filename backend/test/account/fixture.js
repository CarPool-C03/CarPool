const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('../auth/fixture');

async function creaContesto() {
  const account = await creaAccount();
  return { accounts: [account], viaggi: [], sedi: [], account };
}

async function aggiungiAccount(contesto) {
  const account = await creaAccount();
  contesto.accounts.push(account);
  return account;
}

async function creaViaggio(contesto, conducente, stato = 'Attivo') {
  const [sede] = await PersistenzaService.query(
    `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
     VALUES ($1, 'Via di prova, 1', $2) RETURNING id`,
    [`Sede ${randomUUID()}`, conducente.organizzazioneId],
  );
  contesto.sedi.push(sede.id);
  const [viaggio] = await PersistenzaService.query(
    `INSERT INTO "Viaggio"
       ("dataOraPartenza", "puntoPartenza", "postiOfferti", stato, "conducenteId", "sedeId")
     VALUES ('2026-12-01T10:00:00+01:00', 'Salerno', 3, $1, $2, $3)
     RETURNING id`,
    [stato, conducente.membroId, sede.id],
  );
  contesto.viaggi.push(viaggio.id);
  return viaggio.id;
}

async function creaRichiesta(passeggero, viaggioId, stato) {
  const [richiesta] = await PersistenzaService.query(
    `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
     VALUES ($1, $2, $3) RETURNING id`,
    [stato, passeggero.membroId, viaggioId],
  );
  return richiesta.id;
}

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

async function eliminaConCookie(cookie, password = PASSWORD) {
  return request(creaApp())
    .delete('/api/account')
    .set('Cookie', cookie)
    .send({ password });
}

async function pulisciContesto(contesto) {
  const membroIds = contesto.accounts.map(({ membroId }) => membroId).filter(Boolean);
  if (contesto.viaggi.length) {
    await PersistenzaService.query(
      'DELETE FROM "RichiestaPrenotazione" WHERE "viaggioId" = ANY($1::integer[])',
      [contesto.viaggi],
    );
  }
  if (membroIds.length) {
    await PersistenzaService.query(
      'DELETE FROM "RichiestaPrenotazione" WHERE "passeggeroId" = ANY($1::integer[])',
      [membroIds],
    );
    await PersistenzaService.query(
      `DELETE FROM "Valutazione"
       WHERE "autoreId" = ANY($1::integer[]) OR "valutatoId" = ANY($1::integer[])`,
      [membroIds],
    );
    await PersistenzaService.query(
      'DELETE FROM "Messaggio" WHERE "mittenteId" = ANY($1::integer[])',
      [membroIds],
    );
    await PersistenzaService.query(
      'DELETE FROM "Veicolo" WHERE "membroId" = ANY($1::integer[])',
      [membroIds],
    );
  }
  if (contesto.viaggi.length) {
    await PersistenzaService.query('DELETE FROM "Viaggio" WHERE id = ANY($1::integer[])', [
      contesto.viaggi,
    ]);
  }
  if (contesto.sedi.length) {
    await PersistenzaService.query('DELETE FROM "Sede" WHERE id = ANY($1::integer[])', [
      contesto.sedi,
    ]);
  }
  for (const account of [...contesto.accounts].reverse()) await eliminaAccount(account);
}

module.exports = {
  PASSWORD,
  aggiungiAccount,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  eliminaConCookie,
  login,
  pulisciContesto,
};
