const request = require('supertest');
const {
  DATI_VALIDI,
  EMAIL,
  PASSWORD,
  PersistenzaService,
  accountConOrganizzazione,
  creaApp,
  dopoTest,
  preparaTest,
  tokenDalLink,
} = require('./registrazione-support');

beforeEach(preparaTest);
afterEach(async () => {
  const [account] = await PersistenzaService.query(
    'SELECT id FROM "Account" WHERE email = $1',
    [EMAIL],
  );
  if (account) {
    await PersistenzaService.query('DELETE FROM "Sessione" WHERE "accountId" = $1', [
      account.id,
    ]);
  }
  await dopoTest();
});

test('TC_AUTH_01.06 - registrazione, verifica e login: account Attivo autenticabile', async () => {
  const app = request.agent(creaApp());
  const registrazione = await app
    .post('/api/account/registrazione')
    .send(DATI_VALIDI);

  expect(registrazione.status).toBe(201);
  expect((await accountConOrganizzazione(EMAIL)).stato).toBe('InAttesaDiVerifica');

  const verifica = await app
    .post('/api/account/verifica')
    .send({ token: await tokenDalLink() });

  expect(verifica.status).toBe(200);
  expect((await accountConOrganizzazione(EMAIL)).stato).toBe('Attivo');
  expect((await accountConOrganizzazione(EMAIL)).denominazione).toBe(
    'Università degli Studi di Salerno',
  );

  const login = await app
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD });

  expect(login.status).toBe(200);
  expect(login.body).toMatchObject({
    email: EMAIL,
    ruolo: 'Membro',
  });

  const utenteCorrente = await app.get('/api/auth/me');
  expect(utenteCorrente.status).toBe(200);
  expect(utenteCorrente.body.email).toBe(EMAIL);
});
