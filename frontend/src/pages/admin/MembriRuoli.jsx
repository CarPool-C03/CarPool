import { useState } from 'react';
import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Title1,
} from '@fluentui/react-components';
import CampoModulo from '../../components/CampoModulo.jsx';
import { richiesta } from '../../api/client.js';

export default function MembriRuoli() {
  const [email, setEmail] = useState('');
  const [membri, setMembri] = useState([]);
  const [errore, setErrore] = useState('');
  const [conflitto, setConflitto] = useState(false);
  const [caricamento, setCaricamento] = useState(false);

  async function cerca(evento) {
    evento.preventDefault();
    setErrore('');
    setConflitto(false);
    setCaricamento(true);
    try {
      const risultati = await richiesta(`/api/membri?email=${encodeURIComponent(email)}`);
      if (!Array.isArray(risultati)) throw new Error('Risposta non valida dal server');
      setMembri(risultati);
    } catch (erroreRichiesta) {
      setErrore(erroreRichiesta.message);
      setConflitto(false);
      setMembri([]);
    } finally {
      setCaricamento(false);
    }
  }

  async function assegna(membro) {
    const nominativo = `${membro.nome} ${membro.cognome}`;
    if (!window.confirm(`Confermi di assegnare il ruolo Mobility Manager a ${nominativo}?`)) return;
    setErrore('');
    setConflitto(false);
    try {
      const aggiornato = await richiesta(`/api/membri/${membro.id}/ruolo-mm`, { metodo: 'PUT' });
      setMembri((correnti) => correnti.map((elemento) => (
        elemento.id === aggiornato.id
          ? { ...elemento, ruoloMobilityManager: aggiornato.ruoloMobilityManager }
          : elemento
      )));
    } catch (erroreRichiesta) {
      setErrore(erroreRichiesta.message);
      setConflitto(erroreRichiesta.stato === 409);
    }
  }

  return (
    <section>
      <Title1 as="h1">Membri e ruoli</Title1>
      {errore && (conflitto
        ? <MessageBar intent="error"><MessageBarBody>{errore}</MessageBarBody></MessageBar>
        : <div role="alert">{errore}</div>)}
      <Card>
        <form onSubmit={cerca}>
          <CampoModulo
            etichetta="Cerca per e-mail"
            nome="email"
            type="search"
            minLength={3}
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
          />
          <Button appearance="primary" type="submit" disabled={caricamento}>Cerca</Button>
        </form>
      </Card>
      <div>
        {membri.map((membro) => (
          <Card key={membro.id}>
            <h2>{membro.nome} {membro.cognome}</h2>
            <p>{membro.email}</p>
            <p>{membro.organizzazione.denominazione}</p>
            <p>Account: {membro.statoAccount}</p>
            <p>Ruolo Mobility Manager: {membro.ruoloMobilityManager ? 'Sì' : 'No'}</p>
            {!membro.ruoloMobilityManager && (
              <Button onClick={() => assegna(membro)}>Assegna Mobility Manager</Button>
            )}
          </Card>
        ))}
        {!membri.length && !caricamento && <p>Nessun membro trovato.</p>}
      </div>
    </section>
  );
}
