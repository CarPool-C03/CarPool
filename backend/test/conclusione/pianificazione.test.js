jest.mock('node-cron', () => ({ schedule: jest.fn() }));

const cron = require('node-cron');
const { creaApp } = require('../../src/app');
const ViaggioPrenotazioneService = require('../../src/subsystems/viaggiPrenotazioni/ViaggioPrenotazioneService');
const LogService = require('../../src/subsystems/logging/LogService');
const { avviaPianificazione } = require('../../src/pianificazione');

describe('Pianificazione della conclusione automatica', () => {
  beforeEach(() => {
    cron.schedule.mockReset();
  });

  test('Pianificazione: avvia la conclusione ogni 10 minuti', () => {
    avviaPianificazione();
    expect(cron.schedule).toHaveBeenCalledWith(
      '*/10 * * * *',
      expect.any(Function),
      { noOverlap: true },
    );
  });

  test('Pianificazione: server avvia cron e mette in ascolto l’app', () => {
    const app = { listen: jest.fn() };
    const mockCreaApp = jest.fn(() => app);

    try {
      jest.isolateModules(() => {
        jest.doMock('../../src/app', () => ({ creaApp: mockCreaApp }));
        jest.doMock('node-cron', () => ({ schedule: cron.schedule }));
        require('../../src/server');
      });
    } finally {
      jest.dontMock('../../src/app');
    }

    expect(cron.schedule).toHaveBeenCalledWith(
      '*/10 * * * *',
      expect.any(Function),
      { noOverlap: true },
    );
    expect(mockCreaApp).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledTimes(1);
  });

  test('Pianificazione: creare l’app non avvia il processo pianificato', () => {
    creaApp();
    expect(cron.schedule).not.toHaveBeenCalled();
  });

  test('Pianificazione: la callback invoca il service con l’istante corrente', async () => {
    let terminaOperazione;
    const operazione = new Promise((resolve) => {
      terminaOperazione = resolve;
    });
    const concludi = jest
      .spyOn(ViaggioPrenotazioneService, 'concludiViaggiScaduti')
      .mockReturnValue(operazione);
    const inizio = Date.now();

    try {
      avviaPianificazione();
      const callback = cron.schedule.mock.calls[0][1];
      let callbackCompletata = false;
      const callbackTerminata = callback().then(() => {
        callbackCompletata = true;
      });

      expect(concludi).toHaveBeenCalledTimes(1);
      const [adesso] = concludi.mock.calls[0];
      expect(adesso).toBeInstanceOf(Date);
      expect(adesso.getTime()).toBeGreaterThanOrEqual(inizio);
      expect(adesso.getTime()).toBeLessThanOrEqual(Date.now());
      await Promise.resolve();
      expect(callbackCompletata).toBe(false);

      terminaOperazione(0);
      await callbackTerminata;
      expect(callbackCompletata).toBe(true);
    } finally {
      concludi.mockRestore();
    }
  });

  test('Pianificazione: registra una sola volta gli errori asincroni della callback', async () => {
    const concludi = jest
      .spyOn(ViaggioPrenotazioneService, 'concludiViaggiScaduti')
      .mockRejectedValue(new Error('errore di test'));
    const registraErrore = jest.spyOn(LogService, 'registraErrore').mockImplementation(() => {});

    try {
      avviaPianificazione();
      const callback = cron.schedule.mock.calls[0][1];
      await expect(callback()).resolves.toBeUndefined();

      expect(concludi).toHaveBeenCalledTimes(1);
      expect(registraErrore).toHaveBeenCalledTimes(1);
      expect(registraErrore).toHaveBeenCalledWith(
        expect.objectContaining({
          codice: 'ERRORE_INTERNO',
          sottosistema: 'viaggiPrenotazioni',
        }),
      );
    } finally {
      concludi.mockRestore();
      registraErrore.mockRestore();
    }
  });
});
