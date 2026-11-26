const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const NotificaService = require('../../src/subsystems/notifiche/NotificaService');
const LogService = require('../../src/subsystems/logging/LogService');
const {
  aggiungiAccount,
  aggiungiVeicolo,
  allineaOrganizzazione,
  cerca,
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Modifica e cancellazione dei viaggi', () => {
  let contesto;
  let notificaModifica;
  let notificaCancellazione;

  beforeEach(async () => {
    fissaOrologio();
    contesto = await creaContesto({ veicolo: true });
    notificaModifica = jest.spyOn(NotificaService, 'inviaNotificaModifica').mockReturnValue(true);
    notificaCancellazione = jest.spyOn(NotificaService, 'inviaNotificaCancellazione').mockReturnValue(true);
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

  test('TC_TRIP_04.04 - Modifica: invia RF_TRIP_18 solo alle richieste InAttesa dopo il salvataggio', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await inserisciRichiesta(creata.body.id, 'InAttesa');
    await inserisciRichiesta(creata.body.id, 'Rifiutata');
    const nuovaPartenza = 'Salerno, Via Roma';

    const risposta = await request(creaApp())
      .put(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie)
      .send(datiViaggio(contesto.sede.id, { puntoPartenza: nuovaPartenza }));

    expect(risposta.status).toBe(200);
    expect(risposta.body.puntoPartenza).toBe(nuovaPartenza);
    expect(notificaModifica).toHaveBeenCalledTimes(1);
    expect(notificaModifica.mock.calls[0][1]).toMatchObject({
      puntoPartenza: nuovaPartenza,
    });
  });

  test('TC_TRIP_04.05 - Modifica: rifiutata se ci sono richieste Accettate', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await inserisciRichiesta(creata.body.id, 'Accettata');

    const risposta = await request(creaApp())
      .put(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie)
      .send(datiViaggio(contesto.sede.id, { puntoPartenza: 'Dato non salvato' }));

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_CON_PRENOTAZIONI_ACCETTATE');
    const [salvato] = await PersistenzaService.query(
      'SELECT "puntoPartenza" FROM "Viaggio" WHERE id = $1',
      [creata.body.id],
    );
    expect(salvato.puntoPartenza).toBe(datiViaggio(contesto.sede.id).puntoPartenza);
  });

  test('TC_TRIP_04.06 - Modifica: rifiutata per un viaggio non Attivo', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await PersistenzaService.query(
      'UPDATE "Viaggio" SET stato = $1 WHERE id = $2',
      ['Concluso', creata.body.id],
    );

    const risposta = await request(creaApp())
      .put(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie)
      .send(datiViaggio(contesto.sede.id));

    expect(risposta.status).toBe(409);
    expect(risposta.body.errore.codice).toBe('VIAGGIO_NON_ATTIVO');
  });

  test('TC_TRIP_04.07 - Modifica e cancellazione: un altro utente riceve 403', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    const altro = await aggiungiAccount(contesto);
    await aggiungiVeicolo({ conducente: altro });
    const [sedeAltro] = await PersistenzaService.query(
      `INSERT INTO "Sede" (nome, indirizzo, "organizzazioneId")
       VALUES ('Sede alternativa', 'Via di prova, 2', $1) RETURNING id`,
      [altro.organizzazioneId],
    );
    contesto.sedi.push(sedeAltro);
    const modifica = await request(creaApp())
      .put(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', altro.cookie)
      .send(datiViaggio(sedeAltro.id));
    const cancellazione = await request(creaApp())
      .delete(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', altro.cookie);

    expect(modifica.status).toBe(403);
    expect(cancellazione.status).toBe(403);
  });

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

  test('TC_TRIP_04.15 - Modifica: invio fallito non annulla il salvataggio e viene registrato', async () => {
    const creata = await pubblica(contesto, datiViaggio(contesto.sede.id));
    await inserisciRichiesta(creata.body.id, 'InAttesa');
    const erroreLog = jest.spyOn(LogService, 'registraErrore');
    notificaModifica.mockImplementation(() => { throw new Error('provider non disponibile'); });

    const risposta = await request(creaApp())
      .put(`/api/viaggi/${creata.body.id}`)
      .set('Cookie', contesto.cookie)
      .send(datiViaggio(contesto.sede.id, { puntoPartenza: 'Via aggiornata' }));

    expect(risposta.status).toBe(200);
    expect(risposta.body.puntoPartenza).toBe('Via aggiornata');
    expect(erroreLog).toHaveBeenCalledWith(expect.objectContaining({
      codice: 'ERRORE_INTERNO',
      sottosistema: 'viaggiPrenotazioni',
    }));
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
