const express = require('express');
const AccountService = require('../subsystems/account/AccountService');
const { richiediAutenticazione, opzioniCookie } = require('../middleware/autenticazione');
const { ErroreNonAutenticato } = require('../comune/errori');

const router = express.Router();
const NOME_COOKIE = 'carpool_sessione';

router.post('/login', async (richiesta, risposta) => {
  const { email, password } = richiesta.body ?? {};
  const { token, utente } = await AccountService.accedi(email, password);
  risposta.cookie(NOME_COOKIE, token, opzioniCookie());
  risposta.status(200).json(utente);
});

router.post('/logout', richiediAutenticazione, async (richiesta, risposta) => {
  await AccountService.esci(richiesta.tokenSessione);
  risposta.clearCookie(NOME_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  risposta.status(204).end();
});

router.get('/me', richiediAutenticazione, async (richiesta, risposta) => {
  const utente = await AccountService.utenteCorrente(richiesta.accountId);
  if (!utente) throw new ErroreNonAutenticato('Sessione non valida');
  risposta.status(200).json(utente);
});

module.exports = router;
