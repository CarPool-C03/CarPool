import { afterEach, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { UtenteProvider } from './UtenteContext.jsx';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('Sessione: carica utente dall’API configurata con VITE_BACKEND_URL', async () => {
  vi.stubEnv('VITE_BACKEND_URL', 'https://api.carpool.example');
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ id: 1 }),
  });
  vi.stubGlobal('fetch', fetchMock);

  render(
    <UtenteProvider>
      <span>CarPool</span>
    </UtenteProvider>,
  );

  await vi.waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.carpool.example/api/auth/me',
      { credentials: 'include' },
    );
  });
});
