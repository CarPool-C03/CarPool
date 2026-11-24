// Pagina iniziale: mostra lo stato del backend letto da GET /api/health.
import { useEffect, useState } from 'react';
import { Spinner, Text, Title1 } from '@fluentui/react-components';

export default function Home() {
  const [stato, setStato] = useState(null);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((risposta) => {
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
        return risposta.json();
      })
      .then((dati) => setStato(dati.status))
      .catch(() => setErrore(true));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <Title1 as="h1">CarPool</Title1>
      <div style={{ marginTop: 16 }}>
        {errore && <Text>Backend non raggiungibile</Text>}
        {!errore && stato === null && <Spinner label="Controllo del backend…" />}
        {!errore && stato !== null && <Text>Stato del backend: {stato}</Text>}
      </div>
    </main>
  );
}
