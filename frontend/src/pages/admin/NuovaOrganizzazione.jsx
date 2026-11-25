import { useState } from 'react';
import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Title1,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router';
import CampoModulo from '../../components/CampoModulo.jsx';
import { ErroreValidazione, richiesta } from '../../api/client.js';

function messaggiErrore(errore) {
  if (!(errore instanceof ErroreValidazione)) return {};
  return Object.fromEntries(errore.errori.map(({ campo, messaggio }) => [campo, messaggio]));
}

export default function NuovaOrganizzazione() {
  const navigate = useNavigate();
  const [denominazione, setDenominazione] = useState('');
  const [sedi, setSedi] = useState([{ nome: '', indirizzo: '' }]);
  const [domini, setDomini] = useState(['']);
  const [errori, setErrori] = useState({});
  const [erroreGenerico, setErroreGenerico] = useState('');
  const [conflitto, setConflitto] = useState(false);
  const [invio, setInvio] = useState(false);

  function aggiornaSede(indice, campo, valore) {
    setSedi((correnti) => correnti.map((sede, i) => (
      i === indice ? { ...sede, [campo]: valore } : sede
    )));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrori({});
    setErroreGenerico('');
    setConflitto(false);
    setInvio(true);
    try {
      const creata = await richiesta('/api/organizzazioni', {
        metodo: 'POST',
        corpo: { denominazione, sedi, domini },
      });
      navigate(`/admin/organizzazioni/${creata.id}`);
    } catch (errore) {
      const campi = messaggiErrore(errore);
      setErrori(campi);
      if (!Object.keys(campi).length) {
        setErroreGenerico(errore.message);
        setConflitto(errore.stato === 409);
      }
    } finally {
      setInvio(false);
    }
  }

  return (
    <section>
      <Title1 as="h1">Nuova organizzazione</Title1>
      {erroreGenerico && (conflitto
        ? <MessageBar intent="error"><MessageBarBody>{erroreGenerico}</MessageBarBody></MessageBar>
        : <div role="alert">{erroreGenerico}</div>)}
      <Card>
        <form onSubmit={invia}>
          <CampoModulo
            etichetta="Denominazione"
            nome="denominazione"
            required
            maxLength={200}
            value={denominazione}
            errore={errori.denominazione}
            onChange={(evento) => setDenominazione(evento.target.value)}
          />
          <h2>Sedi</h2>
          {sedi.map((sede, indice) => (
            <div key={indice}>
              <CampoModulo
                etichetta="Nome sede"
                nome={`sede-${indice}-nome`}
                required
                maxLength={200}
                value={sede.nome}
                errore={errori[`sedi[${indice}].nome`]}
                onChange={(evento) => aggiornaSede(indice, 'nome', evento.target.value)}
              />
              <CampoModulo
                etichetta="Indirizzo"
                nome={`sede-${indice}-indirizzo`}
                required
                maxLength={300}
                value={sede.indirizzo}
                errore={errori[`sedi[${indice}].indirizzo`]}
                onChange={(evento) => aggiornaSede(indice, 'indirizzo', evento.target.value)}
              />
              {sedi.length > 1 && (
                <Button type="button" onClick={() => setSedi((correnti) => correnti.filter((_, i) => i !== indice))}>
                  Rimuovi sede
                </Button>
              )}
            </div>
          ))}
          {errori.sedi && <p role="alert">{errori.sedi}</p>}
          <Button type="button" onClick={() => setSedi((correnti) => [...correnti, { nome: '', indirizzo: '' }])}>
            Aggiungi sede
          </Button>
          <h2>Domini autorizzati</h2>
          {domini.map((dominio, indice) => (
            <div key={indice}>
              <CampoModulo
                etichetta="Dominio"
                nome={`dominio-${indice}`}
                required
                maxLength={254}
                value={dominio}
                errore={errori[`domini[${indice}]`]}
                onChange={(evento) => setDomini((correnti) => correnti.map((valore, i) => i === indice ? evento.target.value : valore))}
              />
              {domini.length > 1 && (
                <Button type="button" onClick={() => setDomini((correnti) => correnti.filter((_, i) => i !== indice))}>
                  Rimuovi dominio
                </Button>
              )}
            </div>
          ))}
          {errori.domini && <p role="alert">{errori.domini}</p>}
          <Button type="button" onClick={() => setDomini((correnti) => [...correnti, ''])}>
            Aggiungi dominio
          </Button>
          <div><Button appearance="primary" type="submit" disabled={invio}>Registra organizzazione</Button></div>
        </form>
      </Card>
    </section>
  );
}
