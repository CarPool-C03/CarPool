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
const bcrypt = require('bcryptjs');

beforeEach(preparaTest);
afterEach(dopoTest);

describe('Integrità registrazione e verifica e-mail', () => {
  test('Verifica: token scaduto o già usato viene rifiutato', async () => {
    const casi = [
      {
        email: EMAIL,
        aggiornamento:
          'UPDATE "TokenVerifica" SET scadenza = NOW() - INTERVAL \'1 day\' WHERE "accountId" = $1',
      },
      {
        email: 'mario.rossi.usato@studenti.unisa.it',
        aggiornamento: 'UPDATE "TokenVerifica" SET "usatoIl" = NOW() WHERE "accountId" = $1',
      },
    ];

    for (const caso of casi) {
      const registrazione = await request(creaApp())
        .post('/api/account/registrazione')
        .send({ ...DATI_VALIDI, email: caso.email });
      expect(registrazione.status).toBe(201);
      const [account] = await PersistenzaService.query(
        'SELECT id FROM "Account" WHERE email = $1',
        [caso.email],
      );
      await PersistenzaService.query(caso.aggiornamento, [account.id]);

      const verifica = await request(creaApp())
        .post('/api/account/verifica')
        .send({ token: await tokenDalLink() });

      expect(verifica.status).toBe(400);
      expect((await accountConOrganizzazione(caso.email)).stato).toBe('InAttesaDiVerifica');
    }
  });

  test('Registrazione: la password nel database è solo un hash', async () => {
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);
    expect(risposta.status).toBe(201);
    const [account] = await PersistenzaService.query(
      'SELECT "passwordHash" FROM "Account" WHERE email = $1',
      [EMAIL],
    );

    expect(account.passwordHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, account.passwordHash)).toBe(true);
  });

  test('Registrazione: nel database è conservato solo l’hash del token', async () => {
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);
    expect(risposta.status).toBe(201);
    const token = await tokenDalLink();
    const [riga] = await PersistenzaService.query(
      'SELECT tv."hashToken" FROM "TokenVerifica" tv ' +
        'JOIN "Account" a ON a.id = tv."accountId" WHERE a.email = $1',
      [EMAIL],
    );

    expect(riga.hashToken).not.toBe(token);
    expect(riga.hashToken).toBeTruthy();
  });
});
