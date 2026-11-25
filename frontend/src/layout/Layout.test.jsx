import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { UtenteProvider } from '../auth/UtenteContext.jsx';
import Layout from './Layout.jsx';

const UTENTI = {
  membro: {
    ruolo: 'Membro',
    membro: { nome: 'Luca' },
    organizzazione: { denominazione: 'Università degli Studi di Salerno' },
  },
  mobility: {
    ruolo: 'MobilityManager',
    membro: { nome: 'Paolo' },
    organizzazione: { denominazione: 'Università degli Studi di Salerno' },
  },
  amministratore: {
    ruolo: 'Amministratore',
    membro: null,
    organizzazione: null,
  },
};

function mostra(utenteIniziale) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <UtenteProvider utenteIniziale={utenteIniziale}>
          <Layout>
            <div>Contenuto</div>
          </Layout>
        </UtenteProvider>
      </MemoryRouter>
    </FluentProvider>,
  );
}

// Voci del menu nell'intestazione, senza il logo che porta alla pagina iniziale.
function vociMenu() {
  return within(screen.getByRole('banner'))
    .getAllByRole('link')
    .map((voce) => ({ nome: voce.textContent, href: voce.getAttribute('href') }))
    .filter(({ nome }) => nome !== 'CarPool');
}

describe('Layout', () => {
  test('Layout: al visitatore mostra Accedi e Registrati', () => {
    mostra(null);

    expect(
      screen.getByText('Condividi il tragitto nella tua comunità'),
    ).toBeInTheDocument();
    expect(vociMenu()).toEqual([
      { nome: 'Accedi', href: '/login' },
      { nome: 'Registrati', href: '/registrazione' },
    ]);
    expect(screen.queryByRole('button', { name: 'Esci' })).not.toBeInTheDocument();

    const logo = screen.getByRole('link', { name: 'CarPool' });
    expect(logo).toHaveAttribute('href', '/');
    expect(within(logo).getByRole('img', { name: 'Logo CarPool' })).toHaveAttribute(
      'src',
      '/logo.svg',
    );
  });

  test('Layout: mostra il menu del ruolo', () => {
    const membro = mostra(UTENTI.membro);
    expect(vociMenu()).toEqual([
      { nome: 'Home', href: '/home' },
      { nome: 'Cerca viaggi', href: '/ricerca' },
      { nome: 'I miei viaggi', href: '/miei-viaggi' },
      { nome: 'Profilo e veicolo', href: '/profilo' },
    ]);
    expect(screen.getByRole('button', { name: 'Esci' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CarPool' })).toHaveAttribute('href', '/home');
    membro.unmount();

    const mobility = mostra(UTENTI.mobility);
    expect(vociMenu()).toEqual([
      { nome: 'Home', href: '/home' },
      { nome: 'Cerca viaggi', href: '/ricerca' },
      { nome: 'I miei viaggi', href: '/miei-viaggi' },
      { nome: 'Report PSCL', href: '/report' },
      { nome: 'Profilo e veicolo', href: '/profilo' },
    ]);
    expect(screen.getByRole('button', { name: 'Esci' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CarPool' })).toHaveAttribute('href', '/home');
    mobility.unmount();

    const amministratore = mostra(UTENTI.amministratore);
    expect(vociMenu()).toEqual([
      { nome: 'Dashboard', href: '/admin' },
      { nome: 'Organizzazioni', href: '/admin/organizzazioni' },
      { nome: 'Membri e ruoli', href: '/admin/membri' },
    ]);
    expect(screen.getByRole('button', { name: 'Esci' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CarPool' })).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
    amministratore.unmount();
  });
});
