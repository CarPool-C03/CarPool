# Modelli (specifica per gli agenti)

I modelli si tengono in formato **testuale** (PlantUML), versionati con il codice:
un agente li legge senza ambiguità, le modifiche si vedono nelle diff e un task
può citare esattamente il file da leggere. Da un'immagine un agente può leggere
male un nome, una molteplicità o il verso di una freccia senza segnalarlo.

| File | Contenuto |
|---|---|
| `class.puml` | Class diagram: classi, attributi, tipi, associazioni, molteplicità |
| `seq_UC_<PKG>_<n>.puml` | Un sequence diagram per caso d'uso |

Regole:
- Se un modello è stato disegnato con uno strumento grafico, la conversione in
  PlantUML si può chiedere a un agente, ma **va controllata da una persona**.
- Se l'implementazione richiede di cambiare un modello, la modifica va **nella
  stessa PR** e va dichiarata nel template della PR.
- Prima di avviare i task, usare l'agente `controllo-modelli` per trovare
  incoerenze tra caso d'uso, sequence, class diagram e category partition.
