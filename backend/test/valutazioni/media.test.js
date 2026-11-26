const {
  PersistenzaService,
  aggiungiValutazione,
  creaContesto,
  creaViaggio,
  pulisciValutazioni,
  valuta,
  viaggioConPartecipante,
} = require('./fixture');

describe('UC_TRIP_09 - media e valutazione reciproca', () => {
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

  async function preparaMediaConducente() {
    const viaggioUno = await creaViaggio(contesto, { stato: 'Concluso' });
    const viaggioDue = await creaViaggio(contesto, { stato: 'Concluso' });
    await aggiungiValutazione({
      autoreId: contesto.passeggero.membroId,
      valutatoId: contesto.conducente.membroId,
      viaggioId: viaggioUno,
      punteggio: 3,
    });
    await aggiungiValutazione({
      autoreId: contesto.altroPasseggero.membroId,
      valutatoId: contesto.conducente.membroId,
      viaggioId: viaggioDue,
      punteggio: 5,
    });
  }

  test('TC_TRIP_09.07 - Passeggero valuta il Conducente: media 4,33', async () => {
    await preparaMediaConducente();
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookie, viaggioId, {
      valutatoId: contesto.conducente.membroId,
      punteggio: 5,
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body.mediaValutato).toBe(4.33);
  });

  test('TC_TRIP_09.10 - Passeggero valuta il Conducente: media 4,0', async () => {
    await preparaMediaConducente();
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookie, viaggioId, {
      valutatoId: contesto.conducente.membroId,
      punteggio: 4,
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body.mediaValutato).toBe(4);
  });

  test('TC_TRIP_09.11 - commento e media Conducente 3,33', async () => {
    await preparaMediaConducente();
    const viaggioId = await viaggioConPartecipante(contesto);
    const risposta = await valuta(contesto.cookie, viaggioId, {
      valutatoId: contesto.conducente.membroId,
      punteggio: 2,
      commento: 'Ritardo di 10 minuti',
    });

    expect(risposta.status).toBe(201);
    expect(risposta.body).toMatchObject({
      commento: 'Ritardo di 10 minuti',
      mediaValutato: 3.33,
    });
  });
});
