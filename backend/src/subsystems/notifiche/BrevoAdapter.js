const { SendSmtpEmail, TransactionalEmailsApi } = require('@getbrevo/brevo');
const ProviderEmail = require('./ProviderEmail');

class BrevoAdapter extends ProviderEmail {
  constructor({ apiKey = process.env.BREVO_API_KEY, emailMittente = process.env.EMAIL_MITTENTE } = {}) {
    super();
    if (!apiKey) throw new Error('BREVO_API_KEY non configurata');
    if (!emailMittente) throw new Error('EMAIL_MITTENTE non configurata');

    this.api = new TransactionalEmailsApi();
    this.api.authentications.apiKey.apiKey = apiKey;
    this.emailMittente = emailMittente;
  }

  async invia(messaggio) {
    const email = new SendSmtpEmail();
    email.sender = { email: this.emailMittente };
    email.to = [{ email: messaggio.destinatario }];
    email.subject = messaggio.oggetto;
    email.htmlContent = messaggio.html;
    await this.api.sendTransacEmail(email);
    return true;
  }
}

module.exports = BrevoAdapter;
