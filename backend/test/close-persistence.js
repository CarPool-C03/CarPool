afterAll(async () => {
  const PersistenzaService = jest.requireActual('../src/subsystems/persistenza/PersistenzaService');
  await PersistenzaService.chiudi();
});
