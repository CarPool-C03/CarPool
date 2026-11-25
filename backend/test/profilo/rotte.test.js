const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const { PASSWORD, creaAccount, eliminaAccount } = require('../auth/fixture');

const datiVeicolo = {
  modello: 'Fiat Panda',
  colore: 'Bianco',
  numeroPostiPasseggeri: 4,
};

async function login(account) {
  const risposta = await request(creaApp())
    .post('/api/auth/login')
    .send({ email: account.email, password: PASSWORD });
  return risposta.headers['set-cookie'][0].split(';')[0];
}

describe('API profilo e veicolo', () => {
  let membro;
  let cookieMembro;

  beforeEach(async () => {
    membro = await creaAccount();
    cookieMembro = await login(membro);
  });

  afterEach(async () => {
    await PersistenzaService.query(
      'DELETE FROM "Veicolo" WHERE "membroId" = $1',
      [membro.membroId],
    );
    await eliminaAccount(membro);
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('TC_AUTH_03.01 - Profilo: restituisce membro, organizzazione e veicolo', async () => {
    const [organizzazione] = await PersistenzaService.query(
      'SELECT id, denominazione FROM "Organizzazione" WHERE id = $1',
      [membro.organizzazioneId],
    );
    const veicolo = await PersistenzaService.inserisciVeicolo(membro.membroId, datiVeicolo);
    const risposta = await request(creaApp())
      .get('/api/profilo')
      .set('Cookie', cookieMembro);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({
      nome: 'Utente',
      cognome: 'Test',
      email: membro.email,
      organizzazione,
      ruoloMobilityManager: false,
      veicolo,
      valutazioneMedia: null,
    });
  });

  test('TC_AUTH_03.02 - Veicolo: salvato e presente nel profilo', async () => {
    const creato = await request(creaApp())
      .post('/api/profilo/veicolo')
      .set('Cookie', cookieMembro)
      .send(datiVeicolo);
    const profilo = await request(creaApp())
      .get('/api/profilo')
      .set('Cookie', cookieMembro);

    expect(creato.status).toBe(201);
    expect(creato.body).toMatchObject(datiVeicolo);
    expect(profilo.status).toBe(200);
    expect(profilo.body.veicolo).toEqual(creato.body);
  });

  test('TC_AUTH_03.03 - Veicolo: un secondo inserimento viene rifiutato', async () => {
    await request(creaApp())
      .post('/api/profilo/veicolo')
      .set('Cookie', cookieMembro)
      .send(datiVeicolo);
    const secondo = await request(creaApp())
      .post('/api/profilo/veicolo')
      .set('Cookie', cookieMembro)
      .send({ ...datiVeicolo, modello: 'Altro modello' });
    const profilo = await request(creaApp())
      .get('/api/profilo')
      .set('Cookie', cookieMembro);

    expect(secondo.status).toBe(409);
    expect(secondo.body.errore.codice).toBe('VEICOLO_GIA_PRESENTE');
    expect(profilo.body.veicolo.modello).toBe(datiVeicolo.modello);
  });

  test('TC_AUTH_03.04 - Veicolo: posti 0 o negativi, errore sul campo', async () => {
    for (const posti of [0, -1]) {
      const risposta = await request(creaApp())
        .post('/api/profilo/veicolo')
        .set('Cookie', cookieMembro)
        .send({ ...datiVeicolo, numeroPostiPasseggeri: posti });

      expect(risposta.status).toBe(400);
      expect(risposta.body.errori).toContainEqual(expect.objectContaining({
        campo: 'numeroPostiPasseggeri',
      }));
    }

    const veicoli = await PersistenzaService.query(
      'SELECT id FROM "Veicolo" WHERE "membroId" = $1',
      [membro.membroId],
    );
    expect(veicoli).toHaveLength(0);
  });

  test('TC_AUTH_03.05 - Veicolo: rifiuta modello, colore e posti fuori formato', async () => {
    const casi = [
      [{ ...datiVeicolo, modello: 'x'.repeat(101) }, 'modello'],
      [{ ...datiVeicolo, colore: 'x'.repeat(51) }, 'colore'],
      [{ ...datiVeicolo, numeroPostiPasseggeri: 1.5 }, 'numeroPostiPasseggeri'],
    ];

    for (const [dati, campo] of casi) {
      const risposta = await request(creaApp())
        .post('/api/profilo/veicolo')
        .set('Cookie', cookieMembro)
        .send(dati);

      expect(risposta.status).toBe(400);
      expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo }));
    }
  });

  test('TC_AUTH_03.06 - Profilo: veicolo assente restituito come null', async () => {
    const risposta = await request(creaApp())
      .get('/api/profilo')
      .set('Cookie', cookieMembro);

    expect(risposta.status).toBe(200);
    expect(risposta.body.veicolo).toBeNull();
    expect(risposta.body.valutazioneMedia).toBeNull();
  });

  test('Profilo: media valutazioni calcolata da ComunitaService', async () => {
    const autoreUno = await creaAccount();
    const autoreDue = await creaAccount();
    let sedeId;
    let viaggioId;
    try {
      const [sede] = await PersistenzaService.query(
        `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
         VALUES ('Sede test profilo', 'Via di prova, 1', $1) RETURNING id`,
        [membro.organizzazioneId],
      );
      sedeId = sede.id;
      const [viaggio] = await PersistenzaService.query(
        `INSERT INTO "Viaggio" ("dataOraPartenza", "puntoPartenza", "postiOfferti", "conducenteId", "sedeId")
         VALUES ('2026-12-03T08:00:00Z', 'Salerno', 2, $1, $2) RETURNING id`,
        [autoreUno.membroId, sedeId],
      );
      viaggioId = viaggio.id;
      await PersistenzaService.query(
        `INSERT INTO "Valutazione" (punteggio, "autoreId", "valutatoId", "viaggioId")
         VALUES (4, $1, $2, $3), (5, $4, $2, $3)`,
        [autoreUno.membroId, membro.membroId, viaggioId, autoreDue.membroId],
      );
      const risposta = await request(creaApp())
        .get('/api/profilo')
        .set('Cookie', cookieMembro);

      expect(risposta.body.valutazioneMedia).toBe(4.5);
    } finally {
      if (viaggioId) {
        await PersistenzaService.query(
          'DELETE FROM "Valutazione" WHERE "viaggioId" = $1',
          [viaggioId],
        );
        await PersistenzaService.query('DELETE FROM "Viaggio" WHERE id = $1', [viaggioId]);
      }
      if (sedeId) {
        await PersistenzaService.query('DELETE FROM "Sede" WHERE id = $1', [sedeId]);
      }
      await eliminaAccount(autoreDue);
      await eliminaAccount(autoreUno);
    }
  });
});
