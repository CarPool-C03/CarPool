const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
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

describe('Cancellazione dei viaggi', () => {
  let contesto;
  let notificaCancellazione;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
    notificaCancellazione = jest.spyOn(
      NotificaService,
      'inviaNotificaCancellazione',
    ).mockReturnValue(true);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  async function inserisciRichiesta(viaggioId, stato) {
    const passeggero = await aggiungiAccount(contesto);
    await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
    const [richiesta] = await PersistenzaService.query(
      `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
       VALUES ($1, $2, $3) RETURNING id`,
      [stato, passeggero.membroId, viaggioId],
    );
    return { id: richiesta.id, passeggeroId: passeggero.membroId };
  }

  test('TC_TRIP_04.09 - Cancellazione: viaggio Cancellato e richieste Annullate nella stessa transazione', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await inserisciRichiesta(creata.body.id, 'InAttesa');
    await inserisciRichiesta(creata.body.id, 'Accettata');
    await inserisciRichiesta(creata.body.id, 'Rifiutata');

    const risposta = await request(creaApp())
      .delete(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie);
    const [viaggio] = await PersistenzaService.query(
      'SELECT stato FROM "Viaggio" WHERE id = $1',
      [creata.body.id],
    );
    const richieste = await PersistenzaService.query(
      'SELECT stato FROM "RichiestaPrenotazione" WHERE "viaggioId" = $1 ORDER BY id',
      [creata.body.id],
    );

    expect(risposta.status).toBe(204);
    expect(viaggio.stato).toBe('Cancellato');
    expect(richieste.map((elemento) => elemento.stato)).toEqual([
      'Annullata', 'Annullata', 'Rifiutata',
    ]);
    expect(notificaCancellazione).toHaveBeenCalledTimes(2);
  });

  test('TC_TRIP_04.13 - Cancellazione: il viaggio cancellato non compare nella ricerca', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const passeggero = await aggiungiAccount(contesto);
    await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
    contesto.passeggero = passeggero;
    const risposta = await request(creaApp())
      .delete(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie);
    const risultati = await cerca(contesto);
    const [viaggio] = await PersistenzaService.query(
      'SELECT stato FROM "Viaggio" WHERE id = $1',
      [creata.body.id],
    );

    expect(risposta.status).toBe(204);
    expect(viaggio.stato).toBe('Cancellato');
    expect(risultati.status).toBe(200);
    expect(risultati.body.viaggi).toEqual([]);
  });
});
