// Applicazione Express: monta le route REST.
// Separata da server.js perché i test (Supertest) la usano senza aprire una porta.
const express = require('express');
const healthRouter = require('./routes/healthRouter');

function creaApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/health', healthRouter);
  return app;
}

module.exports = { creaApp };
