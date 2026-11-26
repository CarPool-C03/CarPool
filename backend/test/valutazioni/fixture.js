const request = require('supertest');
const { creaApp } = require('../../src/app');
const PersistenzaService = require('../../src/subsystems/persistenza/PersistenzaService');
const {
  creaContesto,
  creaRichiesta,
  creaViaggio,
  pulisciContesto,
} = require('../richieste/fixture');

async function viaggioConPartecipante(contesto, {
  statoViaggio = 'Concluso',
  passeggeroId = contesto.passeggero.membroId,
  statoRichiesta = 'Completata',
} = {}) {
  const viaggioId = await creaViaggio(contesto, { stato: statoViaggio });
  await creaRichiesta(viaggioId, passeggeroId, statoRichiesta);
  return viaggioId;
}

async function valuta(cookie, viaggioId, dati) {
  return request(creaApp())
    .post(`/api/viaggi/${viaggioId}/valutazioni`)
    .set('Cookie', cookie)
    .send(dati);
}

async function aggiungiValutazione({ autoreId, valutatoId, viaggioId, punteggio, commento = null }) {
  const [valutazione] = await PersistenzaService.query(
    `INSERT INTO "Valutazione"
      ("autoreId", "valutatoId", "viaggioId", punteggio, commento)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [autoreId, valutatoId, viaggioId, punteggio, commento],
  );
  return valutazione.id;
}

async function pulisciValutazioni(contesto) {
  if (contesto?.viaggiId.length) {
    await PersistenzaService.query(
      'DELETE FROM "Valutazione" WHERE "viaggioId" = ANY($1::integer[])',
      [contesto.viaggiId],
    );
  }
  await pulisciContesto(contesto);
}

module.exports = {
  PersistenzaService,
  aggiungiValutazione,
  creaContesto,
  creaRichiesta,
  creaViaggio,
  pulisciValutazioni,
  valuta,
  viaggioConPartecipante,
};
