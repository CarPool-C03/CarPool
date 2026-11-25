const express = require('express');
const AccountService = require('../subsystems/account/AccountService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonAutorizzato } = require('../comune/errori');

const router = express.Router();
const soloMembro = [richiediAutenticazione, richiediRuolo('Membro')];

function membroIdDaRichiesta(richiesta) {
  const membroId = richiesta.utente.membro?.id;
  if (!membroId) throw new ErroreNonAutorizzato('Profilo Membro non disponibile');
  return membroId;
}

router.get('/', ...soloMembro, async (richiesta, risposta) => {
  const profilo = await AccountService.profilo(membroIdDaRichiesta(richiesta));
  risposta.status(200).json(profilo);
});

router.post('/veicolo', ...soloMembro, async (richiesta, risposta) => {
  const veicolo = await AccountService.registraVeicolo(
    membroIdDaRichiesta(richiesta),
    richiesta.body,
  );
  risposta.status(201).json(veicolo);
});

module.exports = router;
