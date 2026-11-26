const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiAccount,
  aggiungiSede,
  cerca,
  creaContestoRicerca,
  creaRichiesta,
  creaViaggio,
  fissaOrologio,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('GET /api/viaggi/ricerca', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContestoRicerca();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  test('TC_TRIP_02.01 - sede mancante: segnala il campo sede e non interroga la ricerca', async () => {
    const ricerca = jest.spyOn(PersistenzaService, 'cercaViaggi');
    const risposta = await cerca(contesto, { sedeId: '' });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'sedeId' }),
    );
    expect(ricerca).not.toHaveBeenCalled();
    ricerca.mockRestore();
  });

  test('TC_TRIP_02.02 - data precedente: segnala il campo data', async () => {
    const risposta = await cerca(contesto, { data: '2026-11-30' });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(expect.objectContaining({ campo: 'data' }));
  });

  test('TC_TRIP_02.03 - nessun viaggio compatibile: restituisce elenco vuoto', async () => {
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ viaggi: [] });
  });

  test('TC_TRIP_02.04 - viaggi non Attivo: non compaiono nei risultati', async () => {
    await creaViaggio(contesto, { stato: 'Cancellato' });
    await creaViaggio(contesto, { stato: 'Concluso' });
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi).toEqual([]);
  });

  test('TC_TRIP_02.05 - viaggio senza posti: non compare nei risultati', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 2 });
    const passeggeroAccettato = await aggiungiAccount(contesto);
    const altroPasseggero = await aggiungiAccount(contesto);
    await creaRichiesta(viaggioId, passeggeroAccettato.membroId);
    await creaRichiesta(viaggioId, altroPasseggero.membroId);
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi).toEqual([]);
  });

  test('TC_TRIP_02.06 - un viaggio compatibile: mostra dati e posti residui', async () => {
    const viaggioId = await creaViaggio(contesto, { postiOfferti: 3 });
    await creaRichiesta(viaggioId, contesto.passeggero.membroId);
    const altraSede = await aggiungiSede(
      contesto,
      contesto.passeggero.organizzazioneId,
      'Campus di Baronissi',
    );
    await creaViaggio(contesto, { sedeId: altraSede.id });
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi).toHaveLength(1);
    expect(risposta.body.viaggi[0]).toMatchObject({
      id: viaggioId,
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
      puntoPartenza: 'Salerno, Piazza della Concordia',
      sede: { id: contesto.sede.id, nome: 'Campus di Fisciano' },
      postiOfferti: 3,
      postiDisponibili: 2,
      contributoIndicativoEuro: 3.5,
      conducente: { id: contesto.conducente.membroId },
    });
  });

  test('TC_TRIP_02.07 - più viaggi: ordina per partenza e mantiene il contributo nullo', async () => {
    const primo = await creaViaggio(contesto, {
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
      postiOfferti: 3,
    });
    const secondo = await creaViaggio(contesto, {
      dataOraPartenza: '2026-12-03T08:30:00+01:00',
      postiOfferti: 4,
      contributoIndicativoEuro: null,
    });
    await creaRichiesta(primo, contesto.passeggero.membroId);
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi.map(({ id }) => id)).toEqual([primo, secondo]);
    expect(risposta.body.viaggi).toMatchObject([
      {
        dataOraPartenza: '2026-12-03T08:00:00+01:00',
        puntoPartenza: 'Salerno, Piazza della Concordia',
        postiDisponibili: 2,
        contributoIndicativoEuro: 3.5,
      },
      {
        dataOraPartenza: '2026-12-03T08:30:00+01:00',
        puntoPartenza: 'Salerno, Piazza della Concordia',
        postiDisponibili: 4,
        contributoIndicativoEuro: null,
      },
    ]);
  });

  test('TC_TRIP_02.08 - sede di un’altra organizzazione: segnala la sede', async () => {
    const altraOrganizzazione = await aggiungiAccount(contesto);
    const sedeEsterna = await aggiungiSede(
      contesto,
      altraOrganizzazione.organizzazioneId,
      'Sede di Napoli',
    );
    const risposta = await cerca(contesto, { sedeId: sedeEsterna.id });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'sedeId' }),
    );
  });

  test('TC_TRIP_02.09 - orario minimo trascorso oggi: segnala l’orario', async () => {
    const risposta = await cerca(contesto, {
      data: '2026-12-01',
      orarioMinimo: '09:00',
    });

    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'orarioMinimo' }),
    );
  });

  test('TC_TRIP_02.10 - partenza precedente all’orario minimo: non compare', async () => {
    const compatibile = await creaViaggio(contesto, {
      dataOraPartenza: '2026-12-03T08:00:00+01:00',
    });
    await creaViaggio(contesto, {
      dataOraPartenza: '2026-12-03T07:30:00+01:00',
    });
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi.map(({ id }) => id)).toEqual([compatibile]);
  });

  test('Ricerca: esclude i viaggi del Passeggero stesso', async () => {
    const proprio = await creaViaggio(contesto, {
      conducenteId: contesto.passeggero.membroId,
    });
    const compatibile = await creaViaggio(contesto);
    const risposta = await cerca(contesto);

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi.map(({ id }) => id)).toEqual([compatibile]);
    expect(risposta.body.viaggi.map(({ id }) => id)).not.toContain(proprio);
  });

  test('Ricerca: trova la zona come sottostringa senza distinguere maiuscole', async () => {
    const compatibile = await creaViaggio(contesto);
    const risposta = await cerca(contesto, { zona: 'aLeRnO' });

    expect(risposta.status).toBe(200);
    expect(risposta.body.viaggi.map(({ id }) => id)).toEqual([compatibile]);
  });
});
