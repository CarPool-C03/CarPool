import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import PaginaIniziale from './PaginaIniziale.jsx';

describe('PaginaIniziale', () => {
  test('Pagina iniziale: mostra i testi e i passaggi della comunità', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter>
          <PaginaIniziale />
        </MemoryRouter>
      </FluentProvider>,
    );

    expect(
      screen.getByRole('heading', {
        name: /La stessa destinazione\.Un viaggio da condividere\./,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trova o offri un passaggio verso la tua sede o un evento/),
    ).toBeInTheDocument();
    expect(screen.getByText('Accedi alla comunità della tua organizzazione partner.'))
      .toBeInTheDocument();
    expect(screen.getByText('Scegli un viaggio verso la tua sede o un evento.'))
      .toBeInTheDocument();
    expect(
      screen.getByText(
        'Attendi la conferma del conducente e lascia un feedback dopo il viaggio.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Meno auto, meno spese e una comunità di membri verificati.'),
    ).toBeInTheDocument();
  });
});
