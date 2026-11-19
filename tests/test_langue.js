const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const racine = path.resolve(__dirname, "..");
function chargerCatalogue(fichier, nom){
  const contexte = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(racine, "js", fichier), "utf8"), contexte);
  return contexte.window[nom];
}

const anglais = chargerCatalogue("en.js", "TEXTES_EN");
const espagnol = chargerCatalogue("es.js", "TEXTES_ES");
const italien = chargerCatalogue("it.js", "TEXTES_IT");
assert.ok(anglais && espagnol && italien, "les catalogues anglais, espagnol et italien doivent être chargés");

for(const [nom, catalogue] of [["espagnol", espagnol], ["italien", italien]]){
  assert.deepEqual(Object.keys(catalogue).sort(), Object.keys(anglais).sort(), `${nom} : les catalogues doivent couvrir les mêmes clés`);
  for(const [cle, traduction] of Object.entries(anglais)){
    assert.equal(typeof catalogue[cle], "string", `${nom} : traduction manquante : ${cle}`);
    assert.ok(catalogue[cle].trim(), `${nom} : traduction vide : ${cle}`);
    const variables = (texte) => (texte.match(/\{\d+\}/g) || []).sort();
    const variablesTraduction = variables(catalogue[cle]);
    if(nom === "italien"){
      assert.ok(variables(traduction).every(v => variablesTraduction.includes(v)), `${nom} : variable anglaise manquante : ${cle}`);
      assert.ok(variablesTraduction.every(v => variables(cle).includes(v)), `${nom} : variable absente du texte source : ${cle}`);
    }else{
      assert.deepEqual(variablesTraduction, variables(traduction), `${nom} : variables différentes : ${cle}`);
    }
  }
}

const clesDefis = [
  "Mes défis",
  "Ils sont gardés sur cet appareil et synchronisés avec Google si tu es connecté.",
  "Léger — moins de 5 gorgées",
  "Moyen — 5 à 10 gorgées",
  "Osé — plus de 10 gorgées",
  "Hard HA — préliminaires",
  "Hard HB — actes sexuels",
  "Exemple : Fais un compliment sincère à {nom}.",
  "Aperçu : ",
  "Aperçu : …",
  "Ajouter le défi",
  "Modifier",
  "Enregistrer",
  "Ouvrir",
  "Ajoute tes propres défis pour les modes hot et hard.",
  "Défis personnalisés",
  "Ajoute tes propres défis hot ou hard.",
  "Il manque le texte du défi.",
  "Défi trop long (160 caractères maximum).",
  "Accolades interdites : utilise uniquement {nom}, {nom1} ou {nom2}.",
  "Avec deux joueurs, utilise {nom1} et {nom2}.",
  "Choisis {nom} ou {nom1}/{nom2}, pas les deux.",
  "Le défi doit viser quelqu’un : ajoute {nom}, ou {nom1} et {nom2}.",
  "Choisis un niveau.",
  "version",
  "mouchard actif",
  "PIGEON",
  "défi personnalisé",
  "défis personnalisés"
];
for(const cle of clesDefis){
  assert.ok(anglais[cle] && espagnol[cle], `traduction du défi manquante : ${cle}`);
  assert.ok(italien[cle], `traduction italienne du défi manquante : ${cle}`);
}
for(const cle of [
  "Pas de compte obligatoire, pas de publicité, pas de revente de données.",
  "Le jeu en mode classique marche sur ton téléphone, sans envoyer tes parties.",
  "Toute personne qui connaît le code d'une partie peut la lire",
  "La langue de cette page suit celle de l'application."
]){
  assert.ok(anglais[cle] && espagnol[cle], `traduction de confidentialité manquante : ${cle}`);
  assert.ok(italien[cle], `traduction italienne de confidentialité manquante : ${cle}`);
}

const document = {
  documentElement: { lang: "fr" },
  body: { querySelectorAll: () => [] },
  createTreeWalker: () => ({ nextNode: () => null }),
  querySelector: () => null,
  querySelectorAll: () => []
};
const contexte = vm.createContext({
  window: { TEXTES_ES: espagnol },
  localStorage: { getItem: () => "es" },
  document,
  NodeFilter: { SHOW_TEXT: 4 }
});
contexte.cleTest = Object.keys(espagnol)[0];
vm.runInContext(fs.readFileSync(path.join(racine, "js", "langue.js"), "utf8"), contexte);
assert.equal(vm.runInContext("LANGUE", contexte), "es");
assert.equal(document.documentElement.lang, "es");
assert.equal(vm.runInContext("tr(cleTest)", contexte), espagnol[contexte.cleTest]);
assert.equal(vm.runInContext('tr("clé inconnue")', contexte), "clé inconnue");
assert.equal(vm.runInContext('tr("PIGEON")', contexte), "PALOMA");
const sorbo = vm.runInContext('tr("gorgée")', contexte);
assert.equal(vm.runInContext('trPluriel(1, "gorgée")', contexte), `1 ${sorbo}`);
assert.equal(vm.runInContext('trPluriel(2, "gorgée")', contexte), `2 ${sorbo}s`);
assert.equal(vm.runInContext('trPluriel(0, "gorgée")', contexte), `0 ${sorbo}s`);

const contexteItalien = vm.createContext({
  window: { TEXTES_IT: italien },
  localStorage: { getItem: () => "it" },
  document: {
    documentElement: { lang: "fr" },
    body: { querySelectorAll: () => [] },
    createTreeWalker: () => ({ nextNode: () => null }),
    querySelector: () => null,
    querySelectorAll: () => []
  },
  NodeFilter: { SHOW_TEXT: 4 }
});
contexteItalien.cleTest = Object.keys(italien)[0];
vm.runInContext(fs.readFileSync(path.join(racine, "js", "langue.js"), "utf8"), contexteItalien);
assert.equal(vm.runInContext("LANGUE", contexteItalien), "it");
assert.equal(contexteItalien.document.documentElement.lang, "it");
assert.equal(vm.runInContext("tr(cleTest)", contexteItalien), italien[contexteItalien.cleTest]);
assert.equal(vm.runInContext('tr("PIGEON")', contexteItalien), italien["PIGEON"]);
assert.equal(vm.runInContext('trPluriel(1, "gorgée")', contexteItalien), "1 sorso");
assert.equal(vm.runInContext('trPluriel(2, "gorgée")', contexteItalien), "2 sorsi");
assert.equal(vm.runInContext('trPluriel(2, "recette")', contexteItalien), "2 ricette");
assert.equal(vm.runInContext('tr` gorgée${"s"}`', contexteItalien), " sorsi");
assert.equal(vm.runInContext('tr`Il reste ${2} carte${"s"}`', contexteItalien), "Restano 2 carte");
assert.equal(vm.runInContext('tr`${2} duel${"s"} gagné${"s"}`', contexteItalien), "2 duelli vinti");
assert.equal(vm.runInContext('tr`Tu as ${2} annulation${"s"}.`', contexteItalien), "Hai 2 annullamenti.");
assert.equal(italien["PIGEON"], "PICCIONE");
assert.equal(italien["Spectateur"], "Spettatore");
assert.equal(italien["1 c. à café de sucre"], "1 cucchiaino di zucchero");
assert.equal(italien["Mode en ligne"], "Modalità online");
assert.equal(italien["Ouvrir"], "Apri");
assert.ok(!italien["Envoi du mouchard…"].includes("cookie"));

console.log(`Langues espagnole et italienne : ${Object.keys(espagnol).length} / ${Object.keys(italien).length} traductions et runtimes vérifiés.`);
