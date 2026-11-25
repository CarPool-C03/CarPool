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

router.get('/viaggi/:id', ...soloMembro, async (richiesta, risposta) => {
  const viaggio = await ViaggioPrenotazioneService.dettaglioViaggio(
    idPositivo(richiesta.params.id),
    richiesta.utente.membro.id,
  );
  risposta.status(200).json(viaggio);
});

module.exports = router;
