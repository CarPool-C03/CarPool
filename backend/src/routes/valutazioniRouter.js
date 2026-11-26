const express = require('express');
const ComunitaService = require('../subsystems/valutazioniMessaggi/ComunitaService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonTrovato } = require('../comune/errori');

const router = express.Router();
const soloMembro = [richiediAutenticazione, richiediRuolo('Membro')];

function idPositivo(valore) {
  if (!/^[1-9]\d*$/.test(valore) || !Number.isSafeInteger(Number(valore))) {
    throw new ErroreNonTrovato('Viaggio non trovato');
  }
  return Number(valore);
}

router.post('/viaggi/:id/valutazioni', ...soloMembro, async (richiesta, risposta) => {
  const risultato = await ComunitaService.registraValutazione(
    richiesta.utente.membro.id,
    idPositivo(richiesta.params.id),
    richiesta.body ?? {},
  );
  risposta.status(201).json(risultato);
});

router.get('/valutazioni/da-fare', ...soloMembro, async (richiesta, risposta) => {
  const daFare = await ComunitaService.valutazioniDaFare(richiesta.utente.membro.id);
  risposta.status(200).json({ daFare });
});

module.exports = router;
