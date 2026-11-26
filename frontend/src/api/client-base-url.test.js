import { afterEach, describe, expect, test, vi } from 'vitest';
import { richiesta } from './client.js';

describe('URL del backend', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('client: prefissa le richieste con VITE_BACKEND_URL', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'https://api.carpool.example/');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await richiesta('/api/health');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.carpool.example/api/health',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  test('client: usa il percorso relativo senza VITE_BACKEND_URL', async () => {
    vi.stubEnv('VITE_BACKEND_URL', '');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await richiesta('/api/health');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
