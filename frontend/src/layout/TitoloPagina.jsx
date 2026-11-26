import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router';

const titoli = {
  '/login': 'Accedi',
  '/registrazione': 'Registrazione',
  '/registrazione/inviata': 'Registrazione inviata',
  '/verifica': 'Verifica e-mail',
  '/home': 'Home',
  '/ricerca': 'Cerca viaggi',
  '/viaggi/nuovo': 'Pubblica un viaggio',
  '/viaggi/:id': 'Dettaglio viaggio',
  '/miei-viaggi': 'I miei viaggi',
  '/miei-viaggi/:id/modifica': 'Modifica viaggio',
  '/miei-viaggi/:id/richieste': 'Richieste ricevute',
  '/prenotazioni': 'Le mie prenotazioni',
  '/valutazioni': 'Viaggi da valutare',
  '/valutazioni/:viaggioId': 'Valuta partecipante',
  '/profilo': 'Profilo',
  '/profilo/veicolo': 'Veicolo',
  '/report': 'Report PSCL',
  '/admin': 'Dashboard amministratore',
  '/admin/organizzazioni': 'Organizzazioni',
  '/admin/organizzazioni/nuova': 'Nuova organizzazione',
  '/admin/organizzazioni/:id': 'Dettaglio organizzazione',
  '/admin/membri': 'Membri e ruoli',
};

export default function TitoloPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    const voce = Object.entries(titoli).find(([rotta]) => matchPath(rotta, pathname));
    document.title = voce ? `${voce[1]} · CarPool` : 'CarPool';
  }, [pathname]);

  return null;
}
