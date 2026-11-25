// Rotte dell'interfaccia: una pagina per percorso (path navigazionale del RAD).
import { Route, Routes } from 'react-router';
import { UtenteProvider } from './auth/UtenteContext.jsx';
import Layout from './layout/Layout.jsx';
import RottaProtetta from './components/RottaProtetta.jsx';
import PaginaIniziale from './pages/PaginaIniziale.jsx';
import Home from './pages/Home.jsx';
import PaginaVuota from './pages/PaginaVuota.jsx';

function protetta(ruoli, elemento) {
  return <RottaProtetta ruoli={ruoli}>{elemento}</RottaProtetta>;
}

export default function App() {
  return (
    <UtenteProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<PaginaIniziale />} />
          <Route path="/login" element={<PaginaVuota titolo="Login" />} />
          <Route path="/registrazione" element={<PaginaVuota titolo="Registrazione" />} />
          <Route
            path="/registrazione/inviata"
            element={<PaginaVuota titolo="Controlla la tua e-mail" />}
          />
          <Route path="/verifica" element={<PaginaVuota titolo="Esito della verifica" />} />
          <Route path="/home" element={protetta(['Membro'], <Home />)} />
          <Route
            path="/ricerca"
            element={protetta(['Membro'], <PaginaVuota titolo="Cerca viaggi" />)}
          />
          <Route
            path="/viaggi/nuovo"
            element={protetta(['Membro'], <PaginaVuota titolo="Pubblica un viaggio" />)}
          />
          <Route
            path="/viaggi/:id"
            element={protetta(['Membro'], <PaginaVuota titolo="Dettaglio viaggio" />)}
          />
          <Route
            path="/miei-viaggi"
            element={protetta(['Membro'], <PaginaVuota titolo="I miei viaggi" />)}
          />
          <Route
            path="/miei-viaggi/:id/modifica"
            element={protetta(['Membro'], <PaginaVuota titolo="Modifica viaggio" />)}
          />
          <Route
            path="/miei-viaggi/:id/richieste"
            element={protetta(['Membro'], <PaginaVuota titolo="Richieste ricevute" />)}
          />
          <Route
            path="/prenotazioni"
            element={protetta(['Membro'], <PaginaVuota titolo="Le mie prenotazioni" />)}
          />
          <Route
            path="/valutazioni"
            element={protetta(['Membro'], <PaginaVuota titolo="Da valutare" />)}
          />
          <Route
            path="/valutazioni/:viaggioId"
            element={protetta(['Membro'], <PaginaVuota titolo="Valuta un partecipante" />)}
          />
          <Route
            path="/profilo"
            element={protetta(['Membro'], <PaginaVuota titolo="Profilo e veicolo" />)}
          />
          <Route
            path="/profilo/veicolo"
            element={protetta(['Membro'], <PaginaVuota titolo="Il mio veicolo" />)}
          />
          <Route
            path="/report"
            element={protetta(['MobilityManager'], <PaginaVuota titolo="Report PSCL" />)}
          />
          <Route
            path="/admin"
            element={protetta(['Amministratore'], <PaginaVuota titolo="Dashboard" />)}
          />
          <Route
            path="/admin/organizzazioni"
            element={protetta(
              ['Amministratore'],
              <PaginaVuota titolo="Organizzazioni" />,
            )}
          />
          <Route
            path="/admin/organizzazioni/nuova"
            element={protetta(
              ['Amministratore'],
              <PaginaVuota titolo="Nuova organizzazione" />,
            )}
          />
          <Route
            path="/admin/organizzazioni/:id"
            element={protetta(
              ['Amministratore'],
              <PaginaVuota titolo="Dettaglio organizzazione" />,
            )}
          />
          <Route
            path="/admin/membri"
            element={protetta(['Amministratore'], <PaginaVuota titolo="Membri e ruoli" />)}
          />
        </Routes>
      </Layout>
    </UtenteProvider>
  );
}
