const express = require('express');
const ReportService = require('../subsystems/reportistica/ReportService');
const { richiediAutenticazione, richiediRuolo } = require('../middleware/autenticazione');

const router = express.Router();

router.get(
  '/report',
  richiediAutenticazione,
  richiediRuolo('MobilityManager'),
  async (richiesta, risposta) => {
    const report = await ReportService.generaReport(
      richiesta.utente.membro.id,
      richiesta.query.sedeId,
      richiesta.query.dal,
      richiesta.query.al,
    );
    risposta.status(200).json(report);
  },
);

module.exports = router;
