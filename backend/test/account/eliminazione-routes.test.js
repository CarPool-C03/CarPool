const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  PASSWORD,
  aggiungiAccount,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  eliminaConCookie,
  login,
  pulisciContesto,
} = require('./fixture');

describe('Eliminazione account - route', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
  });

  test('TC_AUTH_07.01 - Eliminazione: password errata, rifiutata', async () => {
    const passeggero = await aggiungiAccount(contesto);
    const viaggioId = await creaViaggio(contesto, contesto.account);
    const richiestaId = await creaRichiesta(passeggero, viaggioId, 'InAttesa');
    await PersistenzaService.query(
      `INSERT INTO "Veicolo" (modello, colore, "numeroPostiPasseggeri", "membroId")
       VALUES ('Fiat Panda', 'Bianco', 4, $1)`,
      [contesto.account.membroId],
    );
    const cookie = await login(contesto.account);
    const risposta = await eliminaConCookie(cookie, 'password-sbagliata');
    const [account] = await PersistenzaService.query(
      'SELECT stato FROM "Account" WHERE id = $1',
      [contesto.account.id],
    );
    const sessione = await request(creaApp()).get('/api/auth/me').set('Cookie', cookie);
    const veicoli = await PersistenzaService.query(
      'SELECT id FROM "Veicolo" WHERE "membroId" = $1',
      [contesto.account.membroId],
    );
    const [viaggio] = await PersistenzaService.query(
      'SELECT stato FROM "Viaggio" WHERE id = $1',
      [viaggioId],
    );
    const [prenotazione] = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE id = $1',
      [richiestaId],
    );

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'password' }),
    );
    expect(account.stato).toBe('Attivo');
    expect(sessione.status).toBe(200);
    expect(veicoli).toHaveLength(1);
    expect(viaggio.stato).toBe('Attivo');
    expect(prenotazione.stato).toBe('InAttesa');
  });

  test('TC_AUTH_07.02 - Eliminazione: Account e Membro anonimizzati e stato Eliminato', async () => {
    await PersistenzaService.query(
      'UPDATE "Membro" SET "ruoloMobilityManager" = TRUE WHERE id = $1',
      [contesto.account.membroId],
    );
    const risposta = await eliminaConCookie(await login(contesto.account));
    const [account] = await PersistenzaService.query(
      'SELECT email, stato FROM "Account" WHERE id = $1',
      [contesto.account.id],
    );
    const [membro] = await PersistenzaService.query(
      'SELECT nome, cognome, "ruoloMobilityManager" FROM "Membro" WHERE id = $1',
      [contesto.account.membroId],
    );

    expect(risposta.status).toBe(204);
    expect(risposta.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^carpool_sessione=;/)]),
    );
    expect(account).toEqual({
      email: `eliminato+${contesto.account.id}@anonimo.invalid`,
      stato: 'Eliminato',
    });
    expect(membro).toEqual({
      nome: 'Utente',
      cognome: 'Eliminato',
      ruoloMobilityManager: false,
    });
  });

  test('TC_AUTH_07.06 - Eliminazione: sessioni chiuse, il login successivo viene rifiutato', async () => {
    const primaSessione = await login(contesto.account);
    const secondaSessione = await login(contesto.account);
    const risposta = await eliminaConCookie(primaSessione);
    const sessioni = await Promise.all(
      [primaSessione, secondaSessione].map((cookie) =>
        request(creaApp()).get('/api/auth/me').set('Cookie', cookie),
      ),
    );
    const loginSuccessivo = await request(creaApp())
      .post('/api/auth/login')
      .send({ email: contesto.account.email, password: PASSWORD });
    const loginAnonimo = await request(creaApp())
      .post('/api/auth/login')
      .send({
        email: `eliminato+${contesto.account.id}@anonimo.invalid`,
        password: PASSWORD,
      });

    expect(risposta.status).toBe(204);
    expect(sessioni.map(({ status }) => status)).toEqual([401, 401]);
    expect(loginSuccessivo.status).toBe(401);
    expect(loginSuccessivo.body.errore.codice).toBe('CREDENZIALI_NON_VALIDE');
    expect(loginAnonimo.status).toBe(403);
    expect(loginAnonimo.body.errore.codice).toBe('ACCOUNT_NON_ATTIVO');
  });
});
