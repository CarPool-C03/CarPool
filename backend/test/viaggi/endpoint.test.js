const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiAccount,
  allineaOrganizzazione,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('API pubblicazione e dettaglio viaggio', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('Pubblicazione: i tre endpoint rifiutano richieste senza autenticazione', async () => {
    const richieste = [
      request(creaApp()).get('/api/viaggi/pubblicazione'),
      request(creaApp()).post('/api/viaggi').send(datiViaggio(contesto.sede.id)),
      request(creaApp()).get('/api/viaggi/1'),
    ];
    const risposte = await Promise.all(richieste);

    expect(risposte.map(({ status }) => status)).toEqual([401, 401, 401]);
    expect(risposte.every(({ body }) =>
      body.errore?.codice === 'NON_AUTENTICATO')).toBe(true);
  });

  test('Pubblicazione: ruolo Amministratore non autorizzato sui tre endpoint', async () => {
    const amministratore = await aggiungiAccount(contesto, {
      tipoAccount: 'Amministratore',
    });
    const richieste = [
      request(creaApp())
        .get('/api/viaggi/pubblicazione')
        .set('Cookie', amministratore.cookie),
      request(creaApp())
        .post('/api/viaggi')
        .set('Cookie', amministratore.cookie)
        .send(datiViaggio(contesto.sede.id)),
      request(creaApp())
        .get('/api/viaggi/1')
        .set('Cookie', amministratore.cookie),
    ];
    const risposte = await Promise.all(richieste);

    expect(risposte.map(({ status }) => status)).toEqual([403, 403, 403]);
  });

  test('Pubblicazione: rifiuta posti negativi e non interi', async () => {
    for (const postiOfferti of [-1, 1.5]) {
      const risposta = await pubblica(
        contesto,
        datiViaggio(contesto.sede.id, { postiOfferti }),
      );
      expect(risposta.status).toBe(400);
      expect(risposta.body.errori).toContainEqual(
        expect.objectContaining({ campo: 'postiOfferti' }),
      );
    }
  });

  test('Pubblicazione: rifiuta un contributo negativo', async () => {
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { contributoIndicativoEuro: -1 }),
    );

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'contributoIndicativoEuro' }),
    );
  });

  test('Pubblicazione: rifiuta una sede di un altra organizzazione', async () => {
    const altroMembro = await aggiungiAccount(contesto);
    const [sedeEsterna] = await PersistenzaService.query(
      `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
       VALUES ('Sede esterna test', 'Via di prova, 2', $1) RETURNING id`,
      [altroMembro.organizzazioneId],
    );
    contesto.sedi.push(sedeEsterna);
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { sedeId: sedeEsterna.id }),
    );

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'sedeId' }),
    );
  });

  test('Dettaglio: visibile alla stessa organizzazione e non alle altre', async () => {
    const rispostaPubblicazione = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id),
    );
    const stessoGruppo = await aggiungiAccount(contesto);
    await allineaOrganizzazione(stessoGruppo, contesto.conducente.organizzazioneId);
    const altraOrganizzazione = await aggiungiAccount(contesto);
    const id = rispostaPubblicazione.body.id;
    const visibile = await request(creaApp())
      .get(`/api/viaggi/${id}`)
      .set('Cookie', stessoGruppo.cookie);
    const nascosto = await request(creaApp())
      .get(`/api/viaggi/${id}`)
      .set('Cookie', altraOrganizzazione.cookie);

    expect(rispostaPubblicazione.status).toBe(201);
    expect(visibile.status).toBe(200);
    expect(visibile.body.id).toBe(id);
    expect(nascosto.status).toBe(404);
  });

  test('Pubblicazione: contributo salvato come informazione nel viaggio Attivo', async () => {
    const disponibilita = await request(creaApp())
      .get('/api/viaggi/pubblicazione')
      .set('Cookie', contesto.cookie);
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { contributoIndicativoEuro: 3.5 }),
    );
    const [salvato] = await PersistenzaService.query(
      'SELECT stato, "contributoIndicativoEuro" FROM "Viaggio" WHERE id = $1',
      [risposta.body.id],
    );

    expect(disponibilita.status).toBe(200);
    expect(disponibilita.body).toEqual({
      postiMassimi: 4,
      sedi: [{ id: contesto.sede.id, nome: contesto.sede.nome }],
    });
    expect(risposta.status).toBe(201);
    expect(salvato).toMatchObject({
      stato: 'Attivo',
      contributoIndicativoEuro: '3.50',
    });
  });
});
