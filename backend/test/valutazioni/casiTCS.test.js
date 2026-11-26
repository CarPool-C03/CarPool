const {
  PersistenzaService,
  aggiungiValutazione,
  creaContesto,
  pulisciValutazioni,
  valuta,
  viaggioConPartecipante,
} = require('./fixture');

describe('UC_TRIP_09 - casi TCS', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciValutazioni(contesto);
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('TC_TRIP_09.01 - viaggio non concluso: valutazione non consentita', async () => {
    const viaggioId = await viaggioConPartecipante(contesto, {
      statoViaggio: 'Attivo',
      statoRichiesta: 'Accettata',
    });
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_NON_CONCLUSO');
  });

  test('TC_TRIP_09.02 - prenotazione rifiutata: partecipazione non consentita', async () => {
    const viaggioId = await viaggioConPartecipante(contesto, {
      passeggeroId: contesto.altroPasseggero.membroId,
      statoRichiesta: 'Rifiutata',
    });
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.altroPasseggero.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(403);
    expect(risposta.body.errore.codice).toBe('NON_PARTECIPANTE');
  });

  test('TC_TRIP_09.03 - valutatore estraneo: valutazione non consentita', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieAltroPasseggero, viaggioId, {
      valutatoId: contesto.conducente.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(403);
    expect(risposta.body.errore.codice).toBe('NON_PARTECIPANTE');
  });

  test('TC_TRIP_09.04 - valutazione duplicata: media e numero restano invariati', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    await aggiungiValutazione({
      autoreId: contesto.conducente.membroId,
      valutatoId: contesto.passeggero.membroId,
      viaggioId,
      punteggio: 3,
    });
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 5,
    });
    const valutazioni = await PersistenzaService.query(
      'SELECT punteggio FROM "Valutazione" WHERE "viaggioId" = $1',
      [viaggioId],
    );

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VALUTAZIONE_GIA_INVIATA');
    expect(valutazioni).toEqual([{ punteggio: 3 }]);
  });

  test('TC_TRIP_09.05 - punteggio mancante: errore sul punteggio', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      commento: 'Puntuale',
    });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'punteggio' }));
  });

  test('TC_TRIP_09.06 - punteggio 1: registrato e media aggiornata', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 1,
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body).toMatchObject({ punteggio: 1, mediaValutato: 1 });
  });

  test('TC_TRIP_09.08 - senza commento: registrata solo la valutazione', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body).toMatchObject({ punteggio: 4, commento: null, mediaValutato: 4 });
  });

  test('TC_TRIP_09.09 - con commento: valutazione e commento registrati', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 3,
      commento: 'Puntuale',
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body).toMatchObject({
      punteggio: 3,
      commento: 'Puntuale',
      mediaValutato: 3,
    });
  });
});
