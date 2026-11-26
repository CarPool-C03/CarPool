// Applicazione Express: monta le route REST.
// Separata da server.js perché i test (Supertest) la usano senza aprire una porta.
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const healthRouter = require('./routes/healthRouter');
const authRouter = require('./routes/authRouter');
const accountRouter = require('./routes/accountRouter');
const organizzazioniRouter = require('./routes/organizzazioniRouter');
const membriRouter = require('./routes/membriRouter');
const profiloRouter = require('./routes/profiloRouter');
const viaggiRouter = require('./routes/viaggiRouter');
const richiesteRouter = require('./routes/richiesteRouter');
const reportRouter = require('./routes/reportRouter');
const valutazioniRouter = require('./routes/valutazioniRouter');
const gestoreErrori = require('./middleware/gestoreErrori');

function creaApp() {
  const app = express();
  app.use(
    cors({
      origin: (origin, callback) =>
        callback(null, Boolean(origin && origin === process.env.FRONTEND_URL)),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/health', healthRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', organizzazioniRouter);
  app.use('/api/membri', membriRouter);
  app.use('/api/profilo', profiloRouter);
  app.use('/api', viaggiRouter);
  app.use('/api', richiesteRouter);
  app.use('/api', reportRouter);
  app.use('/api', valutazioniRouter);
  app.use(gestoreErrori);
  return app;
}

module.exports = { creaApp };
