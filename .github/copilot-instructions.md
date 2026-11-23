# Istruzioni per GitHub Copilot

Le istruzioni del progetto sono in `AGENTS.md`, nella radice del repository:
leggile e rispettale in ogni sessione. Non duplicarle qui.

Promemoria minimi:
- Usa i nomi del class diagram (`docs/modelli/CD_CP_01_Entity.puml`,
  `CD_CP_02_Boundary_Control.puml`) e l'ordine delle chiamate del sequence
  diagram del caso d'uso (`docs/modelli/SD_CP_<nn>_*.puml`).
- I test derivano dai test frame di `docs/test/`: l'esito atteso viene dal
  caso d'uso, mai dal comportamento del codice.
- Se due modelli sono in contrasto o la specifica è incompleta, fermati e
  chiedi.
