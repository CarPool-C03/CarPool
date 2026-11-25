const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const request = require('supertest');
const { creaApp } = require('../../src/app');
const {
  aggiungiAccount,
  allineaOrganizzazione,
  cerca,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Pubblicazione viaggio e ricerca Strategy', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
    contesto.passeggero = await aggiungiAccount(contesto);
    await allineaOrganizzazione(
      contesto.passeggero,
      contesto.conducente.organizzazioneId,
    );
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  async function pubblicaECerca(opzioni, atteso) {
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, opzioni),
    );
    const [viaggio] = await PersistenzaService.query(
      'SELECT stato, "contributoIndicativoEuro" FROM "Viaggio" WHERE id = $1',
      [risposta.body.id],
    );
    const risultati = await cerca(contesto);

    expect(risposta.status).toBe(201);
    expect(viaggio.stato).toBe('Attivo');
    expect(risultati.status).toBe(200);
    expect(risultati.body.viaggi).toContainEqual(
      expect.objectContaining({ id: risposta.body.id, ...atteso }),
    );
  }

  test('TC_TRIP_01.07 - posti pari alla capacita: viaggio Attivo e disponibile in ricerca', async () => {
    await pubblicaECerca({ postiOfferti: 4 }, {
      postiOfferti: 4,
      postiDisponibili: 4,
      contributoIndicativoEuro: null,
    });
  });

  test('TC_TRIP_01.08 - senza contributo: viaggio Attivo e disponibile in ricerca', async () => {
    await pubblicaECerca({ postiOfferti: 2 }, {
      postiOfferti: 2,
      postiDisponibili: 2,
      contributoIndicativoEuro: null,
    });
  });

  test('TC_TRIP_01.09 - contributo 3,50: solo informativo e viaggio ricercabile', async () => {
    await pubblicaECerca({
      postiOfferti: 2,
      contributoIndicativoEuro: 3.5,
    }, {
      postiOfferti: 2,
      postiDisponibili: 2,
      contributoIndicativoEuro: 3.5,
    });
  });

  test('TC_TRIP_03.01 - ricerca e pubblicazione: membro autorizzato invia una richiesta', async () => {
    const pubblicazione = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { postiOfferti: 1 }),
    );
    const risultati = await cerca(contesto);

    expect(pubblicazione.status).toBe(201);
    expect(risultati.status).toBe(200);
    expect(risultati.body.viaggi).toContainEqual(
      expect.objectContaining({ id: pubblicazione.body.id }),
    );

    const richiestaCreata = await request(creaApp())
      .post(`/api/viaggi/${pubblicazione.body.id}/richieste`)
      .set('Cookie', contesto.passeggero.cookie);

    expect(richiestaCreata.status).toBe(201);
    expect(richiestaCreata.body).toMatchObject({
      stato: 'InAttesa',
      viaggio: { id: pubblicazione.body.id, stato: 'Attivo' },
    });
  });
});
