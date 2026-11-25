const envOriginale = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_MITTENTE: process.env.EMAIL_MITTENTE,
};
process.env.BREVO_API_KEY = 'fake-brevo-api-key';
process.env.EMAIL_MITTENTE = 'carpool@example.invalid';

jest.mock('@getbrevo/brevo', () => {
  const mockSendTransacEmail = jest.fn().mockResolvedValue({ body: { messageId: 'test-id' } });

  class TransactionalEmailsApi {
    constructor() {
      this.authentications = { apiKey: { apiKey: null } };
      this.sendTransacEmail = mockSendTransacEmail;
    }
  }

  class SendSmtpEmail {}

  return { TransactionalEmailsApi, SendSmtpEmail, mockSendTransacEmail };
});

const BrevoAdapter = require('../../src/subsystems/notifiche/BrevoAdapter');
const { mockSendTransacEmail } = require('@getbrevo/brevo');

afterAll(() => {
  for (const [nome, valore] of Object.entries(envOriginale)) {
    if (valore === undefined) delete process.env[nome];
    else process.env[nome] = valore;
  }
});

test('BrevoAdapter: chiama TransactionalEmailsApi con destinatario, oggetto e HTML', async () => {
  const adapter = new BrevoAdapter();

  await expect(
    adapter.invia({
      destinatario: 'anna.bianchi@studenti.unisa.it',
      oggetto: 'Richiesta di prenotazione accettata',
      html: '<p>Richiesta accettata</p>',
    }),
  ).resolves.toBe(true);

  expect(adapter.api.authentications.apiKey.apiKey).toBe('fake-brevo-api-key');
  expect(mockSendTransacEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      sender: { email: 'carpool@example.invalid' },
      to: [{ email: 'anna.bianchi@studenti.unisa.it' }],
      subject: 'Richiesta di prenotazione accettata',
      htmlContent: '<p>Richiesta accettata</p>',
    }),
  );
});
