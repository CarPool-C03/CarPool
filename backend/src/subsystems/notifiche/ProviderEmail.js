class ProviderEmail {
  invia(_messaggio) {
    throw new Error('ProviderEmail.invia deve essere implementato');
  }
}

module.exports = ProviderEmail;
