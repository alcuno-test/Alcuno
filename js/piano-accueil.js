// ===== Accueil, thème Fête de la musique : le petit piano sous le titre se joue pour de vrai =====
// La barre colorée sous ALCUNO devient un clavier d'une octave, de Fa 4 à Fa 5 : 8 touches blanches et
// 5 noires, chacune un vrai bouton. Un tap joue sa note (Sons/piano/piano_<touche>.mp3, 0,9 s, de vraies
// hauteurs en tempérament égal). Le son suit le réglage « Sons » et le curseur de volume, comme le reste.
//
// Dans tous les autres thèmes, la barre reste la ligne colorée d'origine : le clavier n'est construit que
// dans le thème musique (appel depuis appliquerTheme, js/reglages.js) et il est retiré quand on en sort.
// Si ce fichier ne se charge pas, la barre garde le dessin de piano en image de fond (style_musique.css) :
// on ne peut pas en jouer, mais rien n'est cassé.
//
// Les 13 notes ne sont téléchargées qu'au premier contact avec le clavier (208 Ko en tout), pas au
// démarrage du jeu. La première note peut donc arriver avec un petit retard ; jouerSon la joue dès
// qu'elle est prête. Elles sont dans sw.js pour être là hors connexion.
const PIANO_BLANCHES = [
  { cle: "fa4",  nom: "Fa" },
  { cle: "sol4", nom: "Sol" },
  { cle: "la4",  nom: "La" },
  { cle: "si4",  nom: "Si" },
  { cle: "do5",  nom: "Do" },
  { cle: "re5",  nom: "Ré" },
  { cle: "mi5",  nom: "Mi" },
  { cle: "fa5",  nom: "Fa aigu" },
];
// apres : numéro de la touche blanche à droite de laquelle la noire est posée (0 = la première)
const PIANO_NOIRES = [
  { cle: "fa4d",  nom: "Fa dièse",  apres: 0 },
  { cle: "sol4d", nom: "Sol dièse", apres: 1 },
  { cle: "la4d",  nom: "La dièse",  apres: 2 },
  { cle: "do5d",  nom: "Do dièse",  apres: 4 },
  { cle: "re5d",  nom: "Ré dièse",  apres: 5 },
];
const SONS_PIANO = PIANO_BLANCHES.concat(PIANO_NOIRES).map((t) => `piano/piano_${t.cle}`);
let pianoSonsDemandes = false;

function toucheDuPiano(t, genre){
  const b = document.createElement("button");
  b.type = "button";
  b.className = `pianoTouche pianoTouche-${genre}`;
  b.dataset.note = t.cle;
  b.setAttribute("aria-label", `Note ${t.nom}`);
  return b;
}

// Les 13 notes d'un coup, au premier contact avec le clavier (les suivantes sont alors instantanées)
function chargerSonsPiano(){
  if (pianoSonsDemandes) return;
  pianoSonsDemandes = true;
  try {
    const ctx = contexteAudio();
    if (ctx) SONS_PIANO.forEach((nom) => chargerSon(ctx, nom));
  } catch (e) {} // (moteur du son pas encore prêt : jouerSon s'en occupera)
}

function jouerToucheDuPiano(touche){
  touche.classList.add("pianoTouche-enfoncee");
  setTimeout(() => touche.classList.remove("pianoTouche-enfoncee"), 150);
  try { vibrer([10]); } catch (e) {}
  try { jouerSon(`piano/piano_${touche.dataset.note}`); } catch (e) {}
}

function majPianoAccueil(){
  const barre = document.querySelector("#choixMode .titreAccueilBarre");
  if (!barre) return;
  const voulu = document.documentElement.dataset.theme === "musique"
    && !document.documentElement.classList.contains("mode-tele");
  const dejaLa = barre.classList.contains("titreAccueilPiano");
  if (!voulu) {
    if (dejaLa) { // retour à la ligne colorée d'origine
      barre.classList.remove("titreAccueilPiano");
      barre.textContent = "";
      barre.setAttribute("aria-hidden", "true");
      barre.removeAttribute("role");
      barre.removeAttribute("aria-label");
    }
    return;
  }
  if (dejaLa) return;
  barre.classList.add("titreAccueilPiano");
  barre.removeAttribute("aria-hidden"); // des boutons sous aria-hidden seraient invisibles pour un lecteur d'écran
  barre.setAttribute("role", "group");
  barre.setAttribute("aria-label", "Petit piano");
  PIANO_BLANCHES.forEach((t, i) => {
    const b = toucheDuPiano(t, "blanche");
    if (i === PIANO_BLANCHES.length - 1) b.classList.add("pianoTouche-fin"); // (pas de trait à droite)
    barre.appendChild(b);
  });
  PIANO_NOIRES.forEach((t) => {
    const b = toucheDuPiano(t, "noire");
    b.style.left = `${(t.apres + 1) * 100 / PIANO_BLANCHES.length}%`; // centrée par un margin-left négatif (CSS)
    barre.appendChild(b);
  });
  // Au doigt posé, pas au doigt levé : une vraie touche de piano sonne tout de suite
  barre.addEventListener("pointerdown", (e) => {
    const touche = e.target.closest && e.target.closest(".pianoTouche");
    if (!touche) return;
    chargerSonsPiano();
    jouerToucheDuPiano(touche);
  });
  // Entrée / Espace au clavier, ou un lecteur d'écran : il n'y a pas eu de pointerdown (e.detail === 0)
  barre.addEventListener("click", (e) => {
    const touche = e.target.closest && e.target.closest(".pianoTouche");
    if (!touche || e.detail !== 0) return;
    chargerSonsPiano();
    jouerToucheDuPiano(touche);
  });
}

// Premier appel : appliquerTheme (js/reglages.js) tourne avant que ce fichier soit chargé, donc c'est ici
// que le clavier est construit au démarrage du jeu. Ensuite, c'est appliquerTheme qui rappelle la fonction.
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", majPianoAccueil);
else majPianoAccueil();
