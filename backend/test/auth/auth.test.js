const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('./fixture');

describe('Autenticazione', () => {
  let account;
  const accountAggiuntivi = [];

  beforeEach(async () => {
    account = await creaAccount();
    accountAggiuntivi.length = 0;
  });

  afterEach(async () => {
    for (const aggiuntivo of accountAggiuntivi) {
      await eliminaAccount(aggiuntivo);
    }
    await eliminaAccount(account);
  });

  test('Login: credenziali corrette, 200 e cookie di sessione httpOnly', async () => {
    const risposta = await request(creaApp())
      .post('/api/auth/login')
      .send({ email: account.email, password: PASSWORD });

    expect(risposta.status).toBe(200);
    expect(risposta.body).toMatchObject({
      id: account.id,
      email: account.email,
      ruolo: 'Membro',
      membro: { id: account.membroId, nome: 'Utente', cognome: 'Test' },
    });
    expect(risposta.headers['set-cookie'][0]).toMatch(/carpool_sessione=.*;.*HttpOnly/i);
  });

  test('Login: password errata, 401 con messaggio generico', async () => {
    const app = creaApp();
    const passwordErrata = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'password-sbagliata' });
    const emailInesistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'assente@test.local', password: 'password-sbagliata' });

    expect(passwordErrata.status).toBe(401);
    expect(passwordErrata.body.errore.codice).toBe('CREDENZIALI_NON_VALIDE');
    expect(emailInesistente.body.errore.codice).toBe('CREDENZIALI_NON_VALIDE');
    expect(passwordErrata.body.errore.messaggio).toBe(emailInesistente.body.errore.messaggio);
  });

  test('Login: account in attesa di verifica, accesso negato', async () => {
    await PersistenzaService.query('UPDATE "Account" SET stato = $1 WHERE id = $2', [
      'InAttesaDiVerifica',
      account.id,
    ]);
    const risposta = await request(creaApp())
      .post('/api/auth/login')
      .send({ email: account.email, password: PASSWORD });

    expect(risposta.status).toBe(403);
    expect(risposta.body.errore.codice).toBe('ACCOUNT_NON_ATTIVO');
  });

  test('Login: Amministratore autenticato con il medesimo endpoint', async () => {
    const amministratore = await creaAccount({ tipoAccount: 'Amministratore' });
    accountAggiuntivi.push(amministratore);
    const risposta = await request(creaApp())
      .post('/api/auth/login')
      .send({ email: amministratore.email, password: PASSWORD });

    expect(risposta.status).toBe(200);
    expect(risposta.body).toMatchObject({
      id: amministratore.id,
      email: amministratore.email,
      ruolo: 'Amministratore',
      membro: null,
      organizzazione: null,
    });
    expect(risposta.headers['set-cookie'][0]).toMatch(/carpool_sessione=.*;.*HttpOnly/i);
  });
});
