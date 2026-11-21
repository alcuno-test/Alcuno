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
const politique = fs.readFileSync(path.join(racine, "confidentialite.html"), "utf8");
assert.ok(!politique.includes("En bref"), "la politique de confidentialité ne doit plus afficher le résumé « En bref »");

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
for(const cle of ["Il est dans Réglages › Thèmes.", "Bravo, album complet !"]){
  assert.ok(anglais[cle] && espagnol[cle], `traduction de l'album manquante : ${cle}`);
  assert.ok(italien[cle], `traduction italienne de l'album manquante : ${cle}`);
}
const clesConfidentialite = [
  "Alcuno · Politique de confidentialité · dernière mise à jour : 20 novembre 2026",
  "Éditeur de l'application et contact",
  "Alcuno est un jeu gratuit développé à titre individuel par son créateur (compte GitHub :",
  "). Pour toute question relative à cette politique ou au traitement des données, vous pouvez utiliser le bouton « Signaler un bug » des Réglages ou ouvrir une demande sur la page GitHub du projet.",
  "Données conservées sur l'appareil",
  "Le jeu conserve dans le stockage local de votre navigateur les éléments suivants :",
  "vos préférences : thème, effets sonores, musique, annonces vocales, langue, options d'accessibilité, mode Préhistoire et organisation des Réglages ;",
  "vos déblocages (thèmes secrets, mode Hard et album de stickers) ;",
  "les informations de la partie en ligne conservées pour permettre sa reprise (code et pseudonyme) ;",
  "un identifiant aléatoire (voir la section « Statistiques d'utilisation ») ainsi qu'une copie du jeu permettant son utilisation hors connexion.",
  "Les données saisies dans l'éthylotest (poids et sexe) ainsi que le journal de diagnostic (« mouchard », désactivé par défaut)",
  "restent exclusivement sur votre appareil",
  ", sauf si vous joignez volontairement un rapport de bug alors que le mouchard est activé.",
  "Pour supprimer ces données, effacez les données du site dans les paramètres de votre navigateur.",
  "Statistiques d'utilisation",
  "Afin d'établir des statistiques d'utilisation, le jeu transmet les données suivantes à sa base de données (Google Firebase) :",
  "un identifiant aléatoire de 12 caractères, propre à l'appareil (il ne correspond ni à votre nom ni à un identifiant publicitaire) ;",
  "le type d'appareil (iPhone, Android ou ordinateur), le thème sélectionné, la version du jeu, la date de la dernière visite, l'état d'installation et l'indication qu'une partie a déjà été lancée ;",
  "des compteurs : visites, parties lancées (par mode et par heure), parties terminées (durée et nombre de joueurs), cartes dorées et choix effectués pour chaque défi du mode Hot ;",
  "l'état courant de l'appareil (menu, partie classique, en ligne ou affichage TV), supprimé lors de la déconnexion ;",
  "des informations techniques fournies par le navigateur : navigateur, version du système, dimensions de l'écran, langue et fuseau horaire ;",
  "(pays, région, ville) ainsi que le",
  "fournisseur d'accès à Internet",
  ", déterminés à partir de votre adresse IP par un service tiers (ipwho.is ou, à défaut, get.geojs.io). Ces services traitent votre adresse IP pour fournir cette information. Alcuno ne conserve pas votre adresse IP et ne sollicite aucune donnée de localisation GPS.",
  "Ces statistiques sont accessibles uniquement au développeur. Elles ne comprennent ni nom, ni pseudonyme, ni adresse e-mail. Elles ne font pas l'objet d'une suppression automatique.",
  "Rapports d'erreur",
  "Lorsqu'une erreur est détectée, le jeu transmet un rapport technique, dans la limite de cinq catégories d'erreurs par ouverture de l'application. Le rapport contient un message expurgé (le texte entre guillemets est supprimé afin d'éviter la transmission d'un pseudonyme ou d'un code de partie), le nom du fichier, le numéro de ligne, la version du jeu et le type d'appareil.",
  "Parties en ligne et affichage sur téléviseur",
  "Lors d'une partie en ligne ou de son affichage sur un téléviseur, le jeu enregistre dans Firebase le code de la partie, les pseudonymes des joueurs, le rôle d'hôte, l'état de la partie et les actions effectuées par les participants.",
  "Toute personne disposant du code d'une partie peut consulter son contenu",
  ". Pour éviter de communiquer votre nom réel aux autres participants, choisissez un pseudonyme.",
  "Les parties sont supprimées automatiquement après trois heures d'inactivité ou, au plus tard, dix heures après leur création. Le nettoyage est effectué toutes les heures.",
  "Authentification Google (facultative)",
  "Lorsque vous choisissez de vous connecter avec Google, Firebase Authentication assure la gestion de votre compte. Votre nom et votre adresse e-mail restent auprès de Google/Firebase ; ils ne sont pas copiés dans la base de données du jeu. Le jeu y enregistre votre progression (déblocages, album de stickers et réglages), accessible et modifiable uniquement par vous.",
  "Pour supprimer votre profil et les données de progression en ligne, accédez aux Réglages, rubrique Appareil, puis sélectionnez « Supprimer mon profil ». Cette action supprime le compte ainsi que la progression sauvegardée en ligne. Les données déjà conservées localement sur votre appareil ne sont pas supprimées.",
  "Signalement d'un problème",
  "Le signalement est transmis uniquement à votre initiative. Il comprend le texte saisi, un diagnostic technique (version du jeu, navigateur et appareil, état du réseau, dimensions de l'écran, code de la partie et pseudonyme si vous êtes en partie, journal des actions et erreurs récentes), le journal du mouchard lorsqu'il est activé, ainsi que les photos ou vidéos que vous joignez.",
  "Le rapport est transmis au service tiers",
  ", qui ne requiert pas de compte. Veuillez ne pas inclure d'informations sensibles (mot de passe, coordonnées personnelles, photo d'une autre personne, etc.).",
  "Caméra, synthèse vocale et partage",
  ": l'accès est demandé uniquement lors du scan du code QR d'une partie. L'image est traitée sur votre appareil ; elle n'est ni enregistrée ni transmise.",
  "Synthèse vocale",
  ": les annonces vocales utilisent le moteur de synthèse vocale de votre appareil.",
  "Partage et presse-papiers",
  ": ces fonctions sont utilisées uniquement lorsque vous sélectionnez « Partager » ou « Copier ».",
  "Services tiers",
  "(hébergement du jeu ; comme tout hébergeur, ce service reçoit l'adresse IP des personnes qui accèdent au site) ;",
  "(transmission des rapports de bug) ;",
  "(page d'authentification, uniquement si vous choisissez de vous connecter).",
  "L'application ne diffuse aucune publicité et n'intègre aucun outil de suivi publicitaire.",
  "Droits relatifs aux données personnelles",
  "Vous pouvez demander l'accès aux données vous concernant, leur rectification ou leur suppression. Les statistiques sont associées à un identifiant aléatoire stocké sur votre appareil et ne sont pas rattachées directement à votre identité ; il peut donc être difficile d'identifier les statistiques d'une personne précise. Pour supprimer votre profil Google, utilisez la fonction « Supprimer mon profil » dans les Réglages.",
  "La présente politique peut être mise à jour afin de refléter l'évolution du jeu. La date indiquée en haut de page correspond à sa dernière mise à jour.",
  "Le contenu de cette page suit la langue sélectionnée dans l'application."
];
for(const cle of clesConfidentialite){
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

const sourceLangue = fs.readFileSync(path.join(racine, "js", "langue.js"), "utf8");
assert.ok(sourceLangue.includes('jouerSon("bouton")'), "changement de langue : un son doit être joué");
assert.ok(sourceLangue.includes('pointerdown'), "changement de langue : le son doit partir à l'appui");
assert.ok(sourceLangue.includes('setTimeout(() =>'), "changement de langue : le rechargement doit laisser passer le son");

const sourceReglages = fs.readFileSync(path.join(racine, "js", "reglages.js"), "utf8");
assert.ok(sourceReglages.includes(".chipLangue"), "changement de langue : puce exclue du double clic sonore générique");
assert.ok(sourceReglages.includes("galaxie: SONS_SABRE"), "thème Star Wars : sons de sabre disponibles");
assert.ok(sourceReglages.includes("donjon: SONS_BDSM"), "thème BDSM : sons respectifs disponibles");
assert.ok(sourceReglages.includes("musique: SONS_SAXO"), "thème Fête de la musique : sons respectifs disponibles");
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
assert.equal(anglais["Langues"], "Languages");
assert.equal(espagnol["Langues"], "Idiomas");
assert.equal(italien["Langues"], "Lingue");

console.log(`Langues espagnole et italienne : ${Object.keys(espagnol).length} / ${Object.keys(italien).length} traductions et runtimes vérifiés.`);
