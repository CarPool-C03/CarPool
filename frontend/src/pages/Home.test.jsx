import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Home from './Home.jsx';

function mostraHome() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <Home />
    </FluentProvider>,
  );
}

describe('Home', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('Home: mostra lo stato restituito da /api/health', async () => {
    const fetchSimulata = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchSimulata);

    mostraHome();

    expect(await screen.findByText('Stato del backend: ok')).toBeInTheDocument();
    expect(fetchSimulata).toHaveBeenCalledWith('/api/health');
  });

  test('Home: segnala il backend non raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rete assente')));

    mostraHome();

    expect(await screen.findByText('Backend non raggiungibile')).toBeInTheDocument();
  });
});
