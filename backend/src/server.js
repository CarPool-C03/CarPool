// Punto di avvio del backend: legge .env e mette in ascolto l'applicazione.
require('dotenv').config({ quiet: true });
const { creaApp } = require('./app');

const porta = Number(process.env.PORT) || 3000;

creaApp().listen(porta, () => {
  console.log(`Backend CarPool in ascolto su http://localhost:${porta}`);
});
