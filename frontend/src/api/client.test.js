import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ErroreNonAutenticato,
  ErroreValidazione,
  richiesta,
} from './client.js';

const locationOriginale = window.location;

describe('client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: locationOriginale,
    });
  });

  test('client: su 401 rimanda al login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            errore: { codice: 'NON_AUTENTICATO', messaggio: 'Sessione scaduta' },
          }),
      }),
    );
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', assign },
    });

    const errore = await richiesta('/api/protetta').catch((e) => e);

    expect(errore).toBeInstanceOf(ErroreNonAutenticato);
    expect(assign).toHaveBeenCalledWith('/login');
  });

  test('client: su 400 restituisce gli errori per campo', async () => {
    const errori = [{ campo: 'email', messaggio: 'Formato non valido' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errori }),
      }),
    );

    const errore = await richiesta('/api/account/registrazione', {
      metodo: 'POST',
      corpo: {},
    }).catch((e) => e);

    expect(errore).toBeInstanceOf(ErroreValidazione);
    expect(errore.errori).toEqual(errori);
  });
});
