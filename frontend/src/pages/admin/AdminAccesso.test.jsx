import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router';
import App from '../../App.jsx';

afterEach(() => vi.unstubAllGlobals());

describe('Amministrazione', () => {
  test('Amministrazione: un Membro non vede la pagina', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        ruolo: 'Membro',
        membro: { nome: 'Luca' },
        organizzazione: { id: 1, denominazione: 'Organizzazione di test' },
      }),
    }));

    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter initialEntries={['/admin']}>
          <App />
        </MemoryRouter>
      </FluentProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /La stessa destinazione/ })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
