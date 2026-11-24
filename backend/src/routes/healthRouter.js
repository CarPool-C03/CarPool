// GET /api/health: controllo che il backend sia in funzione.
const { Router } = require('express');

const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = healthRouter;
