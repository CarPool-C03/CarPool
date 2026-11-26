const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  aggiungiAccount,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  eliminaConCookie,
  login,
  pulisciContesto,
} = require('./fixture');

describe('Eliminazione account - dati associati', () => {
  let contesto;

  beforeEach(async () => {
    contesto = await creaContesto();
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
  });

  test('TC_AUTH_07.03 - Eliminazione: veicolo, messaggi e valutazioni eliminati', async () => {
    const altroMembro = await aggiungiAccount(contesto);
    const viaggioId = await creaViaggio(contesto, contesto.account);
    await PersistenzaService.query(
      `INSERT INTO "Veicolo" (modello, colore, "numeroPostiPasseggeri", "membroId")
       VALUES ('Fiat Panda', 'Bianco', 4, $1)`,
      [contesto.account.membroId],
    );
    await PersistenzaService.query(
      `INSERT INTO "Messaggio" (testo, "dataOraInvio", "mittenteId", "viaggioId")
       VALUES ('Messaggio di test', NOW(), $1, $2)`,
      [contesto.account.membroId, viaggioId],
    );
    for (const [autoreId, valutatoId] of [
      [contesto.account.membroId, altroMembro.membroId],
      [altroMembro.membroId, contesto.account.membroId],
    ]) {
      await PersistenzaService.query(
        `INSERT INTO "Valutazione" (punteggio, "autoreId", "valutatoId", "viaggioId")
         VALUES (5, $1, $2, $3)`,
        [autoreId, valutatoId, viaggioId],
      );
    }

    const risposta = await eliminaConCookie(await login(contesto.account));
    const risultati = await Promise.all([
      PersistenzaService.query('SELECT id FROM "Veicolo" WHERE "membroId" = $1', [
        contesto.account.membroId,
      ]),
      PersistenzaService.query('SELECT id FROM "Messaggio" WHERE "mittenteId" = $1', [
        contesto.account.membroId,
      ]),
      PersistenzaService.query(
        'SELECT id FROM "Valutazione" WHERE "autoreId" = $1 OR "valutatoId" = $1',
        [contesto.account.membroId],
      ),
    ]);

    expect(risposta.status).toBe(204);
    expect(risultati).toEqual([[], [], []]);
  });

  test('TC_AUTH_07.04 - Eliminazione: viaggi attivi Cancellati e richieste non concluse Annullate', async () => {
    const passeggeroInAttesa = await aggiungiAccount(contesto);
    const passeggeroAccettato = await aggiungiAccount(contesto);
    const altroConducente = await aggiungiAccount(contesto);
    const viaggioGuidato = await creaViaggio(contesto, contesto.account);
    const altroViaggio = await creaViaggio(contesto, altroConducente);
    const richieste = [
      await creaRichiesta(passeggeroInAttesa, viaggioGuidato, 'InAttesa'),
      await creaRichiesta(passeggeroAccettato, viaggioGuidato, 'Accettata'),
      await creaRichiesta(contesto.account, altroViaggio, 'InAttesa'),
    ];

    const risposta = await eliminaConCookie(await login(contesto.account));
    const viaggi = await PersistenzaService.query(
      'SELECT id, stato FROM "Viaggio" WHERE id = ANY($1::integer[]) ORDER BY id',
      [[viaggioGuidato, altroViaggio]],
    );
    const statiRichieste = await PersistenzaService.query(
      'SELECT id, stato FROM "RichiestaPrenotazione" WHERE id = ANY($1::integer[]) ORDER BY id',
      [richieste],
    );

    expect(risposta.status).toBe(204);
    expect(viaggi).toEqual([
      { id: viaggioGuidato, stato: 'Cancellato' },
      { id: altroViaggio, stato: 'Attivo' },
    ]);
    expect(statiRichieste.map(({ stato }) => stato)).toEqual([
      'Annullata',
      'Annullata',
      'Annullata',
    ]);
  });

  test('TC_AUTH_07.05 - Eliminazione: i viaggi conclusi restano senza riferimenti personali', async () => {
    const altroMembro = await aggiungiAccount(contesto);
    const viaggioGuidato = await creaViaggio(contesto, contesto.account, 'Concluso');
    const viaggioDaPasseggero = await creaViaggio(contesto, altroMembro, 'Concluso');
    const richiestaGuidata = await creaRichiesta(altroMembro, viaggioGuidato, 'Completata');
    const richiestaDaPasseggero = await creaRichiesta(
      contesto.account,
      viaggioDaPasseggero,
      'Completata',
    );

    const risposta = await eliminaConCookie(await login(contesto.account));
    const viaggi = await PersistenzaService.query(
      `SELECT v.id, v.stato, m.nome, m.cognome
       FROM "Viaggio" v JOIN "Membro" m ON m.id = v."conducenteId"
       WHERE v.id = ANY($1::integer[]) ORDER BY v.id`,
      [[viaggioGuidato, viaggioDaPasseggero]],
    );
    const richieste = await PersistenzaService.query(
      `SELECT r.id, r.stato, m.nome, m.cognome
       FROM "RichiestaPrenotazione" r
       JOIN "Membro" m ON m.id = r."passeggeroId"
       WHERE r.id = ANY($1::integer[]) ORDER BY r.id`,
      [[richiestaGuidata, richiestaDaPasseggero]],
    );

    expect(risposta.status).toBe(204);
    expect(viaggi.map(({ stato }) => stato)).toEqual(['Concluso', 'Concluso']);
    expect(viaggi[0]).toMatchObject({ nome: 'Utente', cognome: 'Eliminato' });
    expect(richieste.map(({ stato }) => stato)).toEqual(['Completata', 'Completata']);
    expect(richieste[1]).toMatchObject({ nome: 'Utente', cognome: 'Eliminato' });
  });
});
