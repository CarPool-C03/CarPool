const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
const ConsoleEmailAdapter = require('../../src/subsystems/notifiche/ConsoleEmailAdapter');
const LogService = require('../../src/subsystems/logging/LogService');
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

describe('Notifiche di cancellazione viaggio', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  test('TC_TRIP_04.16 - Cancellazione: notifica solo i passeggeri con richieste annullate', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const stati = ['InAttesa', 'Accettata', 'Rifiutata', 'Annullata', 'Completata'];
    const passeggeri = [];
    for (const stato of stati) {
      const passeggero = await aggiungiAccount(contesto);
      await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
      passeggeri.push({ passeggero, stato });
      await PersistenzaService.query(
        `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
         VALUES ($1, $2, $3)`,
        [stato, passeggero.membroId, creata.body.id],
      );
    }
    const inviaNotifica = jest.spyOn(NotificaService, 'inviaNotificaCancellazione')
      .mockReturnValue(true);

    const risposta = await request(creaApp())
      .delete(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie);

    expect(risposta.status).toBe(204);
    expect(inviaNotifica.mock.calls.map(([email]) => email).sort()).toEqual(
      passeggeri.slice(0, 2).map(({ passeggero }) => passeggero.email).sort(),
    );
  });

  test('TC_TRIP_04.17 - Cancellazione: il fallimento notifica non annulla il commit', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const passeggero = await aggiungiAccount(contesto);
    await allineaOrganizzazione(passeggero, contesto.conducente.organizzazioneId);
    await PersistenzaService.query(
      `INSERT INTO "RichiestaPrenotazione" (stato, "passeggeroId", "viaggioId")
       VALUES ('InAttesa', $1, $2)`,
      [passeggero.membroId, creata.body.id],
    );
    const erroreLog = jest.spyOn(LogService, 'registraErrore');
    jest.spyOn(ConsoleEmailAdapter.prototype, 'invia').mockReturnValue(false);

    const risposta = await request(creaApp())
      .delete(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie);
    const [viaggio] = await PersistenzaService.query(
      'SELECT stato FROM "Viaggio" WHERE id = $1',
      [creata.body.id],
    );

    expect(risposta.status).toBe(204);
    expect(viaggio.stato).toBe('Cancellato');
    expect(erroreLog).toHaveBeenCalledWith(expect.objectContaining({
      codice: 'INVIO_EMAIL_FALLITO',
      sottosistema: 'notifiche',
    }));
  });
});
