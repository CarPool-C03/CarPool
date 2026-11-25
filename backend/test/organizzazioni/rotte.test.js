const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('../auth/fixture');

function dominioNuovo() {
  return `${randomUUID().replace(/-/g, '')}.partner.test`;
}

function datiOrganizzazione() {
  return {
    denominazione: `Partner ${randomUUID()}`,
    sedi: [{ nome: 'Sede centrale', indirizzo: 'Via di prova, 1' }],
    domini: [dominioNuovo()],
  };
}

async function eliminaOrganizzazione(id) {
  await PersistenzaService.transazione(async (tx) => {
    await tx.query('DELETE FROM "Sede" WHERE "organizzazioneId" = $1', [id]);
    await tx.query('DELETE FROM "DominioEmail" WHERE "organizzazioneId" = $1', [id]);
    await tx.query('DELETE FROM "Organizzazione" WHERE id = $1', [id]);
  });
}

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

describe('API organizzazioni e membri', () => {
  let membro;
  let amministratore;
  let cookieMembro;
  let cookieAmministratore;
  const organizzazioniCreate = [];

  beforeEach(async () => {
    membro = await creaAccount();
    amministratore = await creaAccount({ tipoAccount: 'Amministratore' });
    cookieMembro = await login(membro);
    cookieAmministratore = await login(amministratore);
    organizzazioniCreate.length = 0;
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  afterEach(async () => {
    for (const id of organizzazioniCreate) await eliminaOrganizzazione(id);
    await PersistenzaService.query(
      'DELETE FROM "Sede" WHERE "organizzazioneId" = $1',
      [membro.organizzazioneId],
    );
    await eliminaAccount(amministratore);
    await eliminaAccount(membro);
  });

  test('Organizzazioni: un Membro riceve 403', async () => {
    const risposta = await request(creaApp())
      .post('/api/organizzazioni')
      .set('Cookie', cookieMembro)
      .send(datiOrganizzazione());

    expect(risposta.status).toBe(403);
  });

  test('Organizzazioni: l’Amministratore registra l’organizzazione e la consulta', async () => {
    const dati = datiOrganizzazione();
    const creazione = await request(creaApp())
      .post('/api/organizzazioni')
      .set('Cookie', cookieAmministratore)
      .send(dati);
    organizzazioniCreate.push(creazione.body.id);
    const elenco = await request(creaApp())
      .get('/api/organizzazioni')
      .set('Cookie', cookieAmministratore);
    const dettaglio = await request(creaApp())
      .get(`/api/organizzazioni/${creazione.body.id}`)
      .set('Cookie', cookieAmministratore);

    expect(creazione.status).toBe(201);
    expect(elenco.status).toBe(200);
    expect(dettaglio.status).toBe(200);
    expect(dettaglio.body).toMatchObject({
      denominazione: dati.denominazione,
      sedi: dati.sedi.map((sede) => expect.objectContaining(sede)),
      domini: dati.domini,
    });
  });

  test('Sedi: un Membro riceve solo le sedi della propria organizzazione', async () => {
    const sedePropria = await PersistenzaService.query(
      `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
       VALUES ('Sede test membro', 'Via propria, 1', $1) RETURNING id, nome, indirizzo`,
      [membro.organizzazioneId],
    );
    const altra = await require('../../src/subsystems/organizzazioni/OrganizzazioneService')
      .registraOrganizzazione(datiOrganizzazione());
    organizzazioniCreate.push(altra.id);
    const risposta = await request(creaApp())
      .get('/api/sedi')
      .set('Cookie', cookieMembro);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toContainEqual(sedePropria[0]);
    expect(risposta.body.every((sede) => sede.id !== altra.sedi[0].id)).toBe(true);
  });

  test('Membri: l’Amministratore può cercare per e-mail', async () => {
    const risposta = await request(creaApp())
      .get(`/api/membri?email=${encodeURIComponent(membro.email.slice(0, 5))}`)
      .set('Cookie', cookieAmministratore);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toContainEqual(expect.objectContaining({
      id: membro.membroId,
      email: membro.email,
      statoAccount: 'Attivo',
    }));
  });

  test('Ruolo MM: solo l’Amministratore può assegnarlo tramite API', async () => {
    const rifiutata = await request(creaApp())
      .put(`/api/membri/${membro.membroId}/ruolo-mm`)
      .set('Cookie', cookieMembro);
    const assegnata = await request(creaApp())
      .put(`/api/membri/${membro.membroId}/ruolo-mm`)
      .set('Cookie', cookieAmministratore);

    expect(rifiutata.status).toBe(403);
    expect(assegnata.status).toBe(200);
    expect(assegnata.body).toEqual({ id: membro.membroId, ruoloMobilityManager: true });
  });
});
