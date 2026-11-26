const request = require('supertest');
const { creaApp } = require('../src/app');

describe('CORS', () => {
  const frontendUrl = 'https://app.carpool.example';
  let frontendUrlPrecedente;

  beforeAll(() => {
    frontendUrlPrecedente = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = frontendUrl;
  });

  afterAll(() => {
    if (frontendUrlPrecedente === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = frontendUrlPrecedente;
    }
  });

  test("CORS: accetta solo l'origine FRONTEND_URL", async () => {
    const app = creaApp();
    const consentita = await request(app)
      .get('/api/health')
      .set('Origin', frontendUrl);
    const nonConsentita = await request(app)
      .get('/api/health')
      .set('Origin', 'https://altro.example');

    expect(consentita.headers['access-control-allow-origin']).toBe(frontendUrl);
    expect(consentita.headers['access-control-allow-credentials']).toBe('true');
    expect(nonConsentita.headers['access-control-allow-origin']).toBeUndefined();
  });
});
