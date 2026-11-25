// Rotte dell'interfaccia: una pagina per percorso (path navigazionale del RAD).
import { Route, Routes } from 'react-router';
import { UtenteProvider } from './auth/UtenteContext.jsx';
import Layout from './layout/Layout.jsx';
import RottaProtetta from './components/RottaProtetta.jsx';
import PaginaIniziale from './pages/PaginaIniziale.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Profilo from './pages/Profilo.jsx';
import Ricerca from './pages/Ricerca.jsx';
import PaginaVuota from './pages/PaginaVuota.jsx';
import Registrazione from './pages/Registrazione.jsx';
import RegistrazioneInviata from './pages/RegistrazioneInviata.jsx';
import Verifica from './pages/Verifica.jsx';
import DashboardAmministratore from './pages/admin/DashboardAmministratore.jsx';
import Organizzazioni from './pages/admin/Organizzazioni.jsx';
import NuovaOrganizzazione from './pages/admin/NuovaOrganizzazione.jsx';
import DettaglioOrganizzazione from './pages/admin/DettaglioOrganizzazione.jsx';
import MembriRuoli from './pages/admin/MembriRuoli.jsx';

function protetta(ruoli, elemento) {
  return <RottaProtetta ruoli={ruoli}>{elemento}</RottaProtetta>;
}

export default function App() {
  return (
    <UtenteProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<PaginaIniziale />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrazione" element={<Registrazione />} />
          <Route path="/registrazione/inviata" element={<RegistrazioneInviata />} />
          <Route path="/verifica" element={<Verifica />} />
          <Route path="/home" element={protetta(['Membro'], <Home />)} />
          <Route
            path="/ricerca"
            element={protetta(['Membro'], <Ricerca />)}
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
            element={protetta(['Membro'], <Profilo />)}
          />
          <Route
            path="/profilo/veicolo"
            element={protetta(['Membro'], <Profilo />)}
          />
          <Route
            path="/report"
            element={protetta(['MobilityManager'], <PaginaVuota titolo="Report PSCL" />)}
          />
          <Route
            path="/admin"
            element={protetta(['Amministratore'], <DashboardAmministratore />)}
          />
          <Route
            path="/admin/organizzazioni"
            element={protetta(['Amministratore'], <Organizzazioni />)}
          />
          <Route
            path="/admin/organizzazioni/nuova"
            element={protetta(['Amministratore'], <NuovaOrganizzazione />)}
          />
          <Route
            path="/admin/organizzazioni/:id"
            element={protetta(['Amministratore'], <DettaglioOrganizzazione />)}
          />
          <Route
            path="/admin/membri"
            element={protetta(['Amministratore'], <MembriRuoli />)}
          />
        </Routes>
      </Layout>
    </UtenteProvider>
  );
}
