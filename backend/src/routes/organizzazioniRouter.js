const express = require('express');
const OrganizzazioneService = require('../subsystems/organizzazioni/OrganizzazioneService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');
const { ErroreNonTrovato, ErroreNonAutorizzato } = require('../comune/errori');

const router = express.Router();
const soloAmministratore = [richiediAutenticazione, richiediRuolo('Amministratore')];

function idValido(valore) {
  return /^\d+$/.test(valore) && Number(valore) > 0;
}

router.post('/organizzazioni', ...soloAmministratore, async (richiesta, risposta) => {
  const organizzazione = await OrganizzazioneService.registraOrganizzazione(richiesta.body);
  risposta.status(201).json(organizzazione);
});

router.get('/organizzazioni', ...soloAmministratore, async (_richiesta, risposta) => {
  risposta.status(200).json(await OrganizzazioneService.elencoOrganizzazioni());
});

router.get('/organizzazioni/:id', ...soloAmministratore, async (richiesta, risposta) => {
  if (!idValido(richiesta.params.id)) throw new ErroreNonTrovato('Organizzazione non trovata');
  const organizzazione = await OrganizzazioneService.dettaglioOrganizzazione(
    Number(richiesta.params.id),
  );
  risposta.status(200).json(organizzazione);
});

router.get(
  '/sedi',
  richiediAutenticazione,
  richiediRuolo('Membro'),
  async (richiesta, risposta) => {
    const organizzazioneId = richiesta.utente.organizzazione?.id;
    if (!organizzazioneId) throw new ErroreNonAutorizzato('Organizzazione del Membro non disponibile');
    const sedi = await OrganizzazioneService.sediOrganizzazione(organizzazioneId);
    risposta.status(200).json(sedi);
  },
);

module.exports = router;
