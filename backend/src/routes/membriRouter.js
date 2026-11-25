const express = require('express');
const AccountService = require('../subsystems/account/AccountService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonTrovato } = require('../comune/errori');

const router = express.Router();
const soloAmministratore = [richiediAutenticazione, richiediRuolo('Amministratore')];

router.get('/', ...soloAmministratore, async (richiesta, risposta) => {
  const membri = await AccountService.cercaMembri(richiesta.query.email);
  risposta.status(200).json(membri);
});

router.put('/:id/ruolo-mm', ...soloAmministratore, async (richiesta, risposta) => {
  if (!/^\d+$/.test(richiesta.params.id) || Number(richiesta.params.id) < 1) {
    throw new ErroreNonTrovato('Membro non trovato');
  }
  const membro = await AccountService.assegnaRuoloMobilityManager(Number(richiesta.params.id));
  risposta.status(200).json(membro);
});

module.exports = router;
