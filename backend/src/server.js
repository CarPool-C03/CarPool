// Punto di avvio del backend: legge .env e mette in ascolto l'applicazione.
require('dotenv').config({ quiet: true });
const { creaApp } = require('./app');
const { avviaPianificazione } = require('./pianificazione');
const { eventi, NotificaEsitoObserver } = require('./subsystems/viaggiPrenotazioni/eventi');

const porta = Number(process.env.PORT) || 3000;

eventi.registra(new NotificaEsitoObserver());
avviaPianificazione();

creaApp().listen(porta, () => {
  console.log(`Backend CarPool in ascolto su http://localhost:${porta}`);
});
