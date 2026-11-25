import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { UtenteProvider } from '../auth/UtenteContext.jsx';
import Home from './Home.jsx';

function mostraHome() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <UtenteProvider
          utenteIniziale={{
            ruolo: 'Membro',
            membro: { nome: 'Luca' },
            organizzazione: { denominazione: 'Università degli Studi di Salerno' },
          }}
        >
          <Home />
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

describe('Home', () => {
  test('Home: mostra il saluto e il riquadro di ricerca', () => {
    mostraHome();

    expect(screen.getByText('Ciao Luca, dove vai?')).toBeInTheDocument();
    expect(screen.getByText('Trova un viaggio verso la tua sede')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pubblica un viaggio' })).toBeInTheDocument();
  });
});
