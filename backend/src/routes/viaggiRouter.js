const express = require('express');
const ViaggioPrenotazioneService = require('../subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const RicercaPerSede = require('../subsystems/viaggiPrenotazioni/ricerca/RicercaPerSede');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonTrovato } = require('../comune/errori');

const router = express.Router();
const soloMembro = [richiediAutenticazione, richiediRuolo('Membro')];

function idPositivo(valore) {
  if (!/^\d+$/.test(valore) || !Number.isSafeInteger(Number(valore)) || Number(valore) < 1) {
    throw new ErroreNonTrovato('Viaggio non trovato');
  }
  return Number(valore);
}

router.get(
  '/viaggi/pubblicazione',
  richiediAutenticazione,
  richiediRuolo('Membro'),
  async (richiesta, risposta) => {
    const dati = await ViaggioPrenotazioneService.avviaPubblicazione(
      richiesta.utente.membro.id,
    );
    risposta.status(200).json(dati);
  },
);

router.post(
  '/viaggi',
  richiediAutenticazione,
  richiediRuolo('Membro'),
  async (richiesta, risposta) => {
    const viaggio = await ViaggioPrenotazioneService.pubblicaViaggio(
      richiesta.utente.membro.id,
      richiesta.body,
    );
    risposta.status(201).json(viaggio);
  },
);

router.get(
  '/viaggi/ricerca',
  ...soloMembro,
  async (richiesta, risposta) => {
    const criterio = new RicercaPerSede({
      zona: richiesta.query.zona,
      sedeId: richiesta.query.sedeId,
      data: richiesta.query.data,
      orarioMinimo: richiesta.query.orarioMinimo,
    });
    const viaggi = await ViaggioPrenotazioneService.cercaViaggi(
      criterio,
      richiesta.utente.membro.id,
      richiesta.utente.organizzazione.id,
    );
    risposta.status(200).json({ viaggi });
  },
);

router.get('/viaggi/miei', ...soloMembro, async (richiesta, risposta) => {
  const viaggi = await ViaggioPrenotazioneService.viaggiDelConducente(
    richiesta.utente.membro.id,
  );
  risposta.status(200).json(viaggi);
});

router.put('/viaggi/:id', ...soloMembro, async (richiesta, risposta) => {
  const viaggio = await ViaggioPrenotazioneService.modificaViaggio(
    richiesta.utente.membro.id,
    idPositivo(richiesta.params.id),
    richiesta.body,
  );
  risposta.status(200).json(viaggio);
});

router.delete('/viaggi/:id', ...soloMembro, async (richiesta, risposta) => {
  await ViaggioPrenotazioneService.cancellaViaggio(
    richiesta.utente.membro.id,
    idPositivo(richiesta.params.id),
  );
  risposta.status(204).end();
});

router.get('/viaggi/:id', ...soloMembro, async (richiesta, risposta) => {
  const viaggio = await ViaggioPrenotazioneService.dettaglioViaggio(
    idPositivo(richiesta.params.id),
    richiesta.utente.membro.id,
  );
  risposta.status(200).json(viaggio);
});

module.exports = router;
