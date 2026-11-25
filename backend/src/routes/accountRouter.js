const express = require('express');
const AccountService = require('../subsystems/account/AccountService');

const router = express.Router();

router.post('/registrazione', async (richiesta, risposta) => {
  const risultato = await AccountService.registra(richiesta.body ?? {});
  risposta.status(201).json(risultato);
});

router.post('/verifica', async (richiesta, risposta) => {
  const risultato = await AccountService.verificaLink(richiesta.body?.token);
  risposta.status(200).json(risultato);
});

module.exports = router;
