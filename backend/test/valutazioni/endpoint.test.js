const request = require('supertest');
const { creaApp } = require('../../src/app');
const {
  PersistenzaService,
  aggiungiValutazione,
  creaContesto,
  pulisciValutazioni,
  valuta,
  viaggioConPartecipante,
} = require('./fixture');

describe('API valutazioni', () => {
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

  test('Valutazione: chi non ha partecipato riceve 403', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieAltroPasseggero, viaggioId, {
      valutatoId: contesto.conducente.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(403);
    expect(risposta.body.errore.codice).toBe('NON_PARTECIPANTE');
  });

  test('Valutazione: punteggio fuori da 1..5, errore sul punteggio', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    for (const punteggio of [0, 6, 1.5]) {
      const risposta = await valuta(contesto.cookieConducente, viaggioId, {
        valutatoId: contesto.passeggero.membroId,
        punteggio,
      });

      expect(risposta.status).toBe(400);
      expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'punteggio' }));
    }
  });

  test('Valutazione: commento oltre 500 caratteri, errore sul commento', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookieConducente, viaggioId, {
      valutatoId: contesto.passeggero.membroId,
      punteggio: 4,
      commento: 'a'.repeat(501),
    });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'commento' }));
  });

  test('Da fare: elenca viaggi e persone ancora da valutare', async () => {
    const viaggioId = await viaggioConPartecipante(contesto);
    await aggiungiValutazione({
      autoreId: contesto.conducente.membroId,
      valutatoId: contesto.passeggero.membroId,
      viaggioId,
      punteggio: 4,
    });
    const viaggioSuccessivo = await viaggioConPartecipante(contesto, {
      passeggeroId: contesto.altroPasseggero.membroId,
    });
    const rispostaConducente = await request(creaApp())
      .get('/api/valutazioni/da-fare')
      .set('Cookie', contesto.cookieConducente);
    const rispostaPasseggero = await request(creaApp())
      .get('/api/valutazioni/da-fare')
      .set('Cookie', contesto.cookie);

    expect(rispostaConducente.status).toBe(200);
    expect(rispostaConducente.body.daFare).toEqual([{
      viaggio: expect.objectContaining({ id: viaggioSuccessivo }),
      persone: [{
        membroId: contesto.altroPasseggero.membroId,
        nome: 'Marco',
        cognome: expect.any(String),
        ruolo: 'Passeggero',
      }],
    }]);
    expect(rispostaPasseggero.body.daFare).toEqual([{
      viaggio: expect.objectContaining({ id: viaggioId }),
      persone: [{
        membroId: contesto.conducente.membroId,
        nome: 'Luca',
        cognome: 'Verdi',
        ruolo: 'Conducente',
      }],
    }]);
  });
});
