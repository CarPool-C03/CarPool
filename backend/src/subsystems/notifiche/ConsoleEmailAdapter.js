const ProviderEmail = require('./ProviderEmail');

const tipoPerOggetto = new Map([
  ['Verifica il tuo account CarPool', 'verificaAccount'],
  ['Richiesta di prenotazione accettata', 'esitoPrenotazione'],
  ['Richiesta di prenotazione rifiutata', 'esitoPrenotazione'],
  ['Viaggio modificato', 'modificaViaggio'],
  ['Viaggio cancellato', 'cancellazioneViaggio'],
]);

class ConsoleEmailAdapter extends ProviderEmail {
  static emailInviate = [];

  invia(messaggio) {
    const tipo = tipoPerOggetto.get(messaggio.oggetto);
    if (!tipo) throw new Error('Tipo di e-mail non riconosciuto dal provider console');

    ConsoleEmailAdapter.emailInviate.push({
      destinatario: messaggio.destinatario,
      tipo,
      istante: new Date().toISOString(),
    });
    console.info(JSON.stringify(messaggio));
    return true;
  }
}

module.exports = ConsoleEmailAdapter;
