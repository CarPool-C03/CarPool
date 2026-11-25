const express = require('express');
const ViaggioPrenotazioneService = require('../subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonTrovato } = require('../comune/errori');

const router = express.Router();
const soloMembro = [richiediAutenticazione, richiediRuolo('Membro')];

function idPositivo(valore) {
  if (!/^\d+$/.test(valore) || !Number.isSafeInteger(Number(valore)) || Number(valore) < 1) {
    throw new ErroreNonTrovato('Risorsa non trovata');
  }
  return Number(valore);
}

router.post('/viaggi/:id/richieste', ...soloMembro, async (richiesta, risposta) => {
  const risultato = await ViaggioPrenotazioneService.inviaRichiesta(
    richiesta.utente.membro.id,
    idPositivo(richiesta.params.id),
  );
  risposta.status(201).json(risultato);
});

router.get('/richieste/mie', ...soloMembro, async (richiesta, risposta) => {
  const richieste = await ViaggioPrenotazioneService.richiesteDelPasseggero(
    richiesta.utente.membro.id,
  );
  risposta.status(200).json({ richieste });
});

router.post('/richieste/:id/annulla', ...soloMembro, async (richiesta, risposta) => {
  const risultato = await ViaggioPrenotazioneService.annullaRichiesta(
    richiesta.utente.membro.id,
    idPositivo(richiesta.params.id),
  );
  risposta.status(200).json(risultato);
});

module.exports = router;
