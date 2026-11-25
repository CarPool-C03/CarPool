export function leggiFiltri(search) {
  const parametri = new URLSearchParams(search);
  return {
    zona: parametri.get('zona') ?? '',
    sedeId: parametri.get('sedeId') ?? '',
    data: parametri.get('data') ?? '',
    orarioMinimo: parametri.get('orarioMinimo') ?? '',
  };
}

export function urlRicerca(filtri) {
  const parametri = new URLSearchParams(filtri);
  return `/api/viaggi/ricerca?${parametri.toString()}`;
}

export function dataOraMostrata(dataOraPartenza) {
  const data = new Date(dataOraPartenza);
  const giorno = data.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Rome',
  });
  const orario = data.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
  return `${giorno} · ${orario}`;
}

export function contributoMostrato(contributoIndicativoEuro) {
  if (contributoIndicativoEuro === null || contributoIndicativoEuro === undefined) {
    return 'Contributo non indicato';
  }
  const importo = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(contributoIndicativoEuro);
  return `Contributo indicativo: ${importo}`;
}
