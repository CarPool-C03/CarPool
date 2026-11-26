const PersistenzaService = require('../../persistenza/PersistenzaService');
const NotificaService = require('../../notifiche/NotificaService');
const LogService = require('../../logging/LogService');

const ESITI = {
  RichiestaAccettata: 'Accettata',
  RichiestaRifiutata: 'Rifiutata',
};

class NotificaEsitoObserver {
  async aggiorna(evento) {
    const esito = ESITI[evento.tipo];
    if (!esito) return;

    try {
      const righe = await PersistenzaService.query(
        `SELECT pa.email,
                p.nome AS "nomePasseggero", p.cognome AS "cognomePasseggero",
                c.nome AS "nomeConducente", c.cognome AS "cognomeConducente",
                v."puntoPartenza", COALESCE(s.nome, e.nome) AS destinazione,
                v."dataOraPartenza"
         FROM "RichiestaPrenotazione" r
         JOIN "Viaggio" v ON v.id = r."viaggioId"
         JOIN "Membro" p ON p.id = r."passeggeroId"
         JOIN "Account" pa ON pa.id = p."accountId"
         JOIN "Membro" c ON c.id = v."conducenteId"
         LEFT JOIN "Sede" s ON s.id = v."sedeId"
         LEFT JOIN "Evento" e ON e.id = v."eventoId"
         WHERE r.id = $1 AND v.id = $2`,
        [evento.richiestaId, evento.viaggioId],
      );
      const dati = righe[0];
      if (!dati) throw new Error('Dati della richiesta non disponibili');

      NotificaService.inviaEsitoPrenotazione(
        dati.email,
        {
          nomePasseggero: `${dati.nomePasseggero} ${dati.cognomePasseggero}`,
          nomeConducente: `${dati.nomeConducente} ${dati.cognomeConducente}`,
          puntoPartenza: dati.puntoPartenza,
          destinazione: dati.destinazione,
          dataOraPartenza: dati.dataOraPartenza,
        },
        esito,
      );
    } catch (errore) {
      LogService.registraErrore({
        codice: 'ERRORE_INTERNO',
        descrizione: `Invio della notifica ${evento.tipo} non riuscito: ${errore.message}`,
        sottosistema: 'viaggiPrenotazioni',
      });
    }
  }
}

module.exports = NotificaEsitoObserver;
