const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContesto,
  datiViaggio,
  fissaOrologio,
  pubblica,
  pulisciContesto,
  ripristinaOrologio,
} = require('./fixture');

describe('Pubblicazione viaggio: transizioni DST Europe/Rome', () => {
  let contesto;

  beforeEach(async () => {
    fissaOrologio();
    jest.setSystemTime(new Date('2027-01-15T12:00:00+01:00'));
    contesto = await creaContesto({ veicolo: true });
  });

  afterEach(async () => {
    await pulisciContesto(contesto);
    ripristinaOrologio();
  });

  afterAll(async () => {
    await PersistenzaService.chiudi();
  });

  async function verificaIstante(risposta, istanteAtteso) {
    expect(risposta.status).toBe(201);
    const [viaggio] = await PersistenzaService.query(
      'SELECT "dataOraPartenza" FROM "Viaggio" WHERE id = $1',
      [risposta.body.id],
    );
    expect(new Date(viaggio.dataOraPartenza).toISOString()).toBe(istanteAtteso);

    const dettaglio = await request(creaApp())
      .get(`/api/viaggi/${risposta.body.id}`)
      .set('Cookie', contesto.cookie);
    expect(dettaglio.status).toBe(200);
    expect(new Date(dettaglio.body.dataOraPartenza).toISOString()).toBe(istanteAtteso);
  }

  async function verificaRifiuto(dataOraPartenza) {
    const risposta = await pubblica(
      contesto,
      datiViaggio(contesto.sede.id, { dataOraPartenza }),
    );
    expect(risposta.status).toBe(400);
    expect(risposta.body.errori).toContainEqual(
      expect.objectContaining({ campo: 'dataOraPartenza' }),
    );
    const viaggi = await PersistenzaService.query(
      'SELECT id FROM "Viaggio" WHERE "conducenteId" = $1',
      [contesto.conducente.membroId],
    );
    expect(viaggi).toHaveLength(0);
  }

  test.each([
    ['prima del salto primaverile senza offset', '2027-03-28T01:59:59.999', '2027-03-28T00:59:59.999Z'],
    ['dopo il salto primaverile senza offset', '2027-03-28T03:00:00', '2027-03-28T01:00:00.000Z'],
    ['prima del salto primaverile con offset valido', '2027-03-28T01:59:59.999+01:00', '2027-03-28T00:59:59.999Z'],
    ['dopo il salto primaverile con offset valido', '2027-03-28T03:00:00+02:00', '2027-03-28T01:00:00.000Z'],
    ['prima del ritorno all’ora solare con offset CEST', '2027-10-31T02:59:59.999+02:00', '2027-10-31T00:59:59.999Z'],
    ['dopo il ritorno all’ora solare con offset CET', '2027-10-31T02:00:00+01:00', '2027-10-31T01:00:00.000Z'],
    ['prima occorrenza dell’ora ambigua con offset CEST', '2027-10-31T02:30:00+02:00', '2027-10-31T00:30:00.000Z'],
    ['seconda occorrenza dell’ora ambigua con offset CET', '2027-10-31T02:30:00+01:00', '2027-10-31T01:30:00.000Z'],
  ])(
    'Pubblicazione DST: persiste e rilegge l’istante Europe/Rome per %s',
    async (_, dataOraPartenza, istanteAtteso) => {
      const risposta = await pubblica(
        contesto,
        datiViaggio(contesto.sede.id, { dataOraPartenza }),
      );

      await verificaIstante(risposta, istanteAtteso);
    },
  );

  test.each([
    ['inesistente senza offset', '2027-03-28T02:30:00'],
    ['inesistente con offset CET', '2027-03-28T02:30:00+01:00'],
    ['inesistente con offset CEST', '2027-03-28T02:30:00+02:00'],
    ['ambiguo senza offset', '2027-10-31T02:30:00'],
    ['offset non coerente con Europe/Rome', '2027-03-28T01:30:00+02:00'],
  ])(
    'Pubblicazione DST: rifiuta l’orario %s senza persistere il viaggio',
    async (_, dataOraPartenza) => {
      await verificaRifiuto(dataOraPartenza);
    },
  );
});
