const {
  DATI_VALIDI,
  EMAIL,
  NotificaService,
  PersistenzaService,
  creaAccountEsistente,
  contaAccount,
  creaApp,
  preparaTest,
  dopoTest,
  accountConOrganizzazione,
  tokenDalLink,
} = require('./registrazione-support');
const request = require('supertest');

beforeEach(preparaTest);
afterEach(dopoTest);

describe('Registrazione e verifica e-mail', () => {
  test('TC_AUTH_01.01 - dato obbligatorio mancante: errore sul cognome', async () => {
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send({ ...DATI_VALIDI, cognome: '' });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'cognome' })]),
    );
    expect(await contaAccount(EMAIL)).toBe(0);
    expect(NotificaService.inviaLinkVerifica).not.toHaveBeenCalled();
  });

  test('TC_AUTH_01.02 - e-mail in formato non valido', async () => {
    const email = 'mario.rossi@@studenti.unisa.it';
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send({ ...DATI_VALIDI, email });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'email' })]),
    );
    expect(await contaAccount(email)).toBe(0);
    expect(NotificaService.inviaLinkVerifica).not.toHaveBeenCalled();
  });

  test('TC_AUTH_01.03 - dominio non partner: nessun account', async () => {
    const email = 'mario.rossi@gmail.com';
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send({ ...DATI_VALIDI, email });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'email' })]),
    );
    expect(await contaAccount(email)).toBe(0);
    expect(NotificaService.inviaLinkVerifica).not.toHaveBeenCalled();
  });

  test('TC_AUTH_01.04 - e-mail già registrata', async () => {
    await creaAccountEsistente(EMAIL);
    const numeroAccount = await contaAccount(EMAIL);
    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'email' })]),
    );
    expect(await contaAccount(EMAIL)).toBe(numeroAccount);
    expect(NotificaService.inviaLinkVerifica).not.toHaveBeenCalled();
  });

  test('TC_AUTH_01.05 - link non valido: account ancora in attesa di verifica', async () => {
    const registrazione = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);
    expect(registrazione.status).toBe(201);
    expect((await accountConOrganizzazione(EMAIL)).stato).toBe('InAttesaDiVerifica');
    expect(NotificaService.inviaLinkVerifica).toHaveBeenCalledTimes(1);

    const verifica = await request(creaApp())
      .post('/api/account/verifica')
      .send({ token: 'token-non-emesso-dal-sistema' });

    expect(verifica.status).toBe(400);
    expect(verifica.body.errori).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'token' })]),
    );
    expect((await accountConOrganizzazione(EMAIL)).stato).toBe('InAttesaDiVerifica');
  });

  test('TC_AUTH_01.06 - link valido: account Attivo associato all’organizzazione', async () => {
    const registrazione = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);
    expect(registrazione.status).toBe(201);
    expect((await accountConOrganizzazione(EMAIL)).stato).toBe('InAttesaDiVerifica');
    expect(NotificaService.inviaLinkVerifica).toHaveBeenCalledWith(
      EMAIL,
      expect.stringContaining('token='),
    );

    const verifica = await request(creaApp())
      .post('/api/account/verifica')
      .send({ token: await tokenDalLink() });

    expect(verifica.status).toBe(200);
    expect((await accountConOrganizzazione(EMAIL)).stato).toBe('Attivo');
    expect((await accountConOrganizzazione(EMAIL)).denominazione).toBe(
      'Università degli Studi di Salerno',
    );
  });

  test('TC_AUTH_01.07 - fallimento invio e-mail: risposta 500 e nessun dato residuo', async () => {
    NotificaService.inviaLinkVerifica.mockReturnValue(false);

    const risposta = await request(creaApp())
      .post('/api/account/registrazione')
      .send(DATI_VALIDI);

    expect(risposta.status).toBe(500);
    expect(risposta.body.errore).toMatchObject({ codice: 'ERRORE_INTERNO' });
    expect(await contaAccount(EMAIL)).toBe(0);
    const righe = await PersistenzaService.query(
      'SELECT COUNT(*)::int AS quantita FROM "Membro" m ' +
        'JOIN "Account" a ON a.id = m."accountId" WHERE a.email = $1',
      [EMAIL],
    );
    expect(righe[0].quantita).toBe(0);
    const tokenResidui = await PersistenzaService.query(
      'SELECT COUNT(*)::int AS quantita FROM "TokenVerifica" tv ' +
        'JOIN "Account" a ON a.id = tv."accountId" WHERE a.email = $1',
      [EMAIL],
    );
    expect(tokenResidui[0].quantita).toBe(0);
  });
});
