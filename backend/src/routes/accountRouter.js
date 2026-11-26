const express = require('express');
const AccountService = require('../subsystems/account/AccountService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');

const router = express.Router();

router.delete('/', richiediAutenticazione, richiediRuolo('Membro'), async (richiesta, risposta) => {
  await AccountService.eliminaAccount(richiesta.accountId, richiesta.body?.password);
  risposta.clearCookie('carpool_sessione', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  risposta.status(204).end();
});

router.post('/registrazione', async (richiesta, risposta) => {
  const risultato = await AccountService.registra(richiesta.body ?? {});
  risposta.status(201).json(risultato);
});

router.post('/verifica', async (richiesta, risposta) => {
  const risultato = await AccountService.verificaLink(richiesta.body?.token);
  risposta.status(200).json(risultato);
});

module.exports = router;
