class Membro {
  constructor({ id, nome, cognome, ruoloMobilityManager }) {
    this.id = id;
    this.nome = nome;
    this.cognome = cognome;
    this.ruoloMobilityManager = ruoloMobilityManager;
  }

  assegnaRuoloMobilityManager() {
    this.ruoloMobilityManager = true;
  }
}

module.exports = Membro;
