const request = require('supertest');
const { creaApp } = require('../src/app');

describe('Health', () => {
  test('Health: GET /api/health risponde 200 con { status: "ok" }', async () => {
    const risposta = await request(creaApp()).get('/api/health');

    expect(risposta.status).toBe(200);
    expect(risposta.body).toEqual({ status: 'ok' });
  });
});
