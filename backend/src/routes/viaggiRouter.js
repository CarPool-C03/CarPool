const express = require('express');
const ViaggioPrenotazioneService = require('../subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const RicercaPerSede = require('../subsystems/viaggiPrenotazioni/ricerca/RicercaPerSede');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');

const router = express.Router();

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
  richiediAutenticazione,
  richiediRuolo('Membro'),
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

router.get(
  '/viaggi/:id',
  richiediAutenticazione,
  richiediRuolo('Membro'),
  async (richiesta, risposta) => {
    const viaggio = await ViaggioPrenotazioneService.dettaglioViaggio(
      Number(richiesta.params.id),
      richiesta.utente.membro.id,
    );
    risposta.status(200).json(viaggio);
  },
);

module.exports = router;
