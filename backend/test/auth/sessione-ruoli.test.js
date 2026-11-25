const express = require('express');
const request = require('supertest');
const cookieParser = require('cookie-parser');
const { creaApp } = require('../../src/app');
const gestoreErrori = require('../../src/middleware/gestoreErrori');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  PASSWORD,
  creaAccount,
  eliminaAccount,
} = require('./fixture');
const {
  richiediAutenticazione,
  richiediRuolo,
} = require('../../src/middleware/autenticazione');

describe('Sessione e ruoli', () => {
  let account;

  beforeEach(async () => {
    account = await creaAccount();
  });

  afterEach(async () => {
    await eliminaAccount(account);
  });

  async function accedi() {
    return request(creaApp())
      .post('/api/auth/login')
      .send({ email: account.email, password: PASSWORD });
  }

  test('Me: senza sessione distingue NON_AUTENTICATO dalle credenziali non valide', async () => {
    const risposta = await request(creaApp()).get('/api/auth/me');

    expect(risposta.status).toBe(401);
    expect(risposta.body.errore.codice).toBe('NON_AUTENTICATO');
  });

  test('Sessione: dopo 30 minuti di inattività le API protette rispondono 401', async () => {
    const login = await accedi();
    const inattivita = new Date(Date.now() - 31 * 60 * 1000);
    await PersistenzaService.query(
      'UPDATE "Sessione" SET "ultimaAttivita" = $1 WHERE "accountId" = $2',
      [inattivita, account.id],
    );

    const risposta = await request(creaApp())
      .get('/api/auth/me')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);

    expect(risposta.status).toBe(401);
    expect(risposta.body.errore.codice).toBe('NON_AUTENTICATO');
  });

  test('Sessione: ogni richiesta aggiorna ultimaAttivita', async () => {
    const login = await accedi();
    const precedente = new Date(Date.now() - 5 * 60 * 1000);
    await PersistenzaService.query(
      'UPDATE "Sessione" SET "ultimaAttivita" = $1 WHERE "accountId" = $2',
      [precedente, account.id],
    );

    const risposta = await request(creaApp())
      .get('/api/auth/me')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);
    const [sessione] = await PersistenzaService.query(
      'SELECT "ultimaAttivita" FROM "Sessione" WHERE "accountId" = $1',
      [account.id],
    );

    expect(risposta.status).toBe(200);
    expect(new Date(sessione.ultimaAttivita).getTime()).toBeGreaterThan(precedente.getTime());
  });

  test('Logout: dopo il logout le API protette rispondono 401', async () => {
    const login = await accedi();
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const logout = await request(creaApp()).post('/api/auth/logout').set('Cookie', cookie);
    const successiva = await request(creaApp()).get('/api/auth/me').set('Cookie', cookie);
    const sessioni = await PersistenzaService.query(
      'SELECT id FROM "Sessione" WHERE "accountId" = $1',
      [account.id],
    );

    expect(logout.status).toBe(204);
    expect(successiva.status).toBe(401);
    expect(successiva.body.errore.codice).toBe('NON_AUTENTICATO');
    expect(sessioni).toHaveLength(0);
  });

  test('Ruoli: route da Amministratore chiamata da un Membro, 403', async () => {
    const login = await accedi();
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.get(
      '/solo-amministratore',
      richiediAutenticazione,
      richiediRuolo('Amministratore'),
      (_richiesta, risposta) => risposta.sendStatus(204),
    );
    app.use(gestoreErrori);
    const risposta = await request(app)
      .get('/solo-amministratore')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);

    expect(risposta.status).toBe(403);
    expect(risposta.body.errore.codice).toBe('NON_AUTORIZZATO');
  });

  test('Me: restituisce utente e ruolo', async () => {
    const login = await accedi();
    const risposta = await request(creaApp())
      .get('/api/auth/me')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toMatchObject({
      id: account.id,
      email: account.email,
      ruolo: 'Membro',
      membro: { id: account.membroId, nome: 'Utente', cognome: 'Test' },
      organizzazione: { id: account.organizzazioneId },
    });
  });
});
