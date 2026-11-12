// =============================================================================================
// ALCUNO : Zizi-coptère : un petit zizi qui tourne comme une hélice, à côté du titre de l'accueil
// (fichier chargé après js/reglages.js et js/regles.js dans index.html : voir l'en-tête de script.js)
// =============================================================================================
// #region Zizi-coptère
// Débloqué en finissant une partie en mode hard (récap de fin, js/regles.js ; hôte ou pas, en ligne aussi).
// Visible seulement avec le thème Donjon (BDSM), sur l'écran d'accueil (#choixMode : caché avec lui).
// Touché : il tourne et suit le doigt ; lâché, on peut le lancer : gravité, rebonds sur les bords, rotation qui ralentit.
// Sa place n'est pas gardée : à chaque ouverture du jeu, il revient à côté du titre.
const CLE_ZIZI_COPTERE = "alcuno_zizi_coptere";
// APPLI TEST : débloqué de base pour l'essayer (ZIZI_TEST_DEBLOQUE). NE PAS PORTER dans le vrai jeu (voir PORTAGE.md).
const ZIZI_TEST_DEBLOQUE = true;
function ziziCoptereDebloque(){
  if (ZIZI_TEST_DEBLOQUE) return true;
  try { return localStorage.getItem(CLE_ZIZI_COPTERE) === "1"; } catch (e) { return false; }
}
function debloquerZiziCoptere(){
  // (la clé, et pas ziziCoptereDebloque : dans l'appli test il est débloqué de base, la notif doit quand même sortir)
  let deja = false;
  try { deja = localStorage.getItem(CLE_ZIZI_COPTERE) === "1"; } catch (e) {}
  if (deja) return;
  try { localStorage.setItem(CLE_ZIZI_COPTERE, "1"); } catch (e) {}
  majZiziCoptere();
  // Fenêtre par-dessus le récap de fin (une seule fois par téléphone), même style que « Thème BDSM débloqué »
  const enDonjon = document.documentElement.dataset.theme === "donjon";
  try {
    afficherFenetreDeblocage("fenetreZiziCoptere", {
      secret: "Partie hard terminée !",
      titre: "🚁 Zizi-coptère<br>débloqué !",
      texte: enDonjon ? "Il t'attend sur l'accueil.<br>Touche-le, lance-le !" : "Il t'attend sur l'accueil,<br>avec le thème BDSM",
      boutons: enDonjon ? [{ libelle: "OK", principal: true }] : [
        { libelle: "Mettre le thème BDSM", principal: true, action: () => { const p = document.getElementById("pastilleDonjon"); if (p) p.click(); } },
        { libelle: "Plus tard" }
      ]
    });
  } catch (e) {}
}

const ziziCoptere = (() => {
  // (une <div> et pas un <button> : les thèmes habillent tous les boutons de l'accueil)
  const el = document.createElement("div");
  el.setAttribute("role", "button");
  el.id = "ziziCoptere";
  el.setAttribute("aria-label", "Zizi-coptère");
  // Dessiné à l'horizontale, centré : il tourne autour de son milieu, comme une pale d'hélice
  // Style BDSM : peau en dégradé brillant, anneau de cuir noir clouté à la base, contour bordeaux, halo rouge (CSS)
  el.innerHTML = `<svg viewBox="0 0 120 60" aria-hidden="true">
    <defs>
      <radialGradient id="ziziBoule" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffd9d2"/><stop offset=".55" stop-color="#f19c95"/><stop offset="1" stop-color="#c8636a"/></radialGradient>
      <linearGradient id="ziziTige" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6cf"/><stop offset=".35" stop-color="#f7b5ad"/><stop offset="1" stop-color="#d97d7f"/></linearGradient>
      <radialGradient id="ziziGland" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffb3bd"/><stop offset=".5" stop-color="#ec5f78"/><stop offset="1" stop-color="#a8243f"/></radialGradient>
      <linearGradient id="ziziCuir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a42"/><stop offset=".5" stop-color="#0c0c10"/><stop offset="1" stop-color="#26262c"/></linearGradient>
    </defs>
    <g stroke="#4a0a18" stroke-width="2.4" stroke-linejoin="round">
      <circle cx="21" cy="19" r="14.5" fill="url(#ziziBoule)"/>
      <circle cx="21" cy="41" r="14.5" fill="url(#ziziBoule)"/>
      <path d="M30 18 H88 Q94 30 88 42 H30 Q26 30 30 18z" fill="url(#ziziTige)"/>
      <path d="M85 15.5 Q114 13 114 30 Q114 47 85 44.5 Q79 30 85 15.5z" fill="url(#ziziGland)"/>
    </g>
    <path d="M46 37 Q58 33 66 38 T84 36" stroke="#c96b75" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M106 30 h6" stroke="#4a0a18" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="62" cy="23" rx="20" ry="2.6" fill="#fff" opacity=".6"/>
    <ellipse cx="96" cy="21" rx="6" ry="2.6" fill="#fff" opacity=".65"/>
    <circle cx="15" cy="13" r="3" fill="#fff" opacity=".55"/>
    <rect x="31" y="15" width="9" height="30" rx="2.5" fill="url(#ziziCuir)" stroke="#000" stroke-width="1.4"/>
    <g fill="#e6e6ef" stroke="#7a7a86" stroke-width=".8"><circle cx="35.5" cy="20" r="1.9"/><circle cx="35.5" cy="27" r="1.9"/><circle cx="35.5" cy="34" r="1.9"/><circle cx="35.5" cy="41" r="1.9"/></g>
  </svg>`;
  return el;
})();
document.getElementById("choixMode").appendChild(ziziCoptere);

// ----- Physique -----
// Au départ il est posé à côté du titre, sans gravité. Dès qu'on l'a touché puis lâché, il vit sa vie :
// gravité, rebonds sur les 4 bords de l'écran, frottement au sol, et sa rotation ralentit peu à peu.
// Touché : il se met à tourner (de plus en plus vite tant qu'on le tient) et suit le doigt ; lâché en
// glissant, il part avec la vitesse du doigt (on peut le lancer).
const ZIZI = {
  gravite: 2600,        // px/s²
  rebond: 0.72,         // vitesse gardée à chaque rebond
  frottementSol: 3.5,   // ralentissement au sol (par seconde)
  vitesseMax: 4500,     // px/s (un lancer trop violent)
  rotationMax: 1800,    // degrés/s quand on le tient
  rotationTenu: 1400,   // degrés/s² gagnés tant qu'on le tient
  freinRotation: 0.55   // la rotation perd ~42 % par seconde une fois lâché
};
let ziziPose = true;      // posé à côté du titre (pas encore lancé)
let ziziTenu = false;
let ziziX = 0, ziziY = 0, ziziVx = 0, ziziVy = 0;
let ziziAngle = 0, ziziRotation = 0;
let ziziBoucle = false, ziziDernier = 0;
let ziziTraces = [];      // dernières positions du doigt (vitesse du lancer)

// (largeur utile : sans la barre de défilement, sinon il passait derrière le bord droit)
function largeurEcranZizi(){ return document.documentElement.clientWidth || window.innerWidth; }
function hauteurEcranZizi(){ return document.documentElement.clientHeight || window.innerHeight; }
function tailleZizi(){ return ziziCoptere.offsetWidth || 140; }
function dessinerZizi(){
  ziziCoptere.style.left = ziziX + "px";
  ziziCoptere.style.top = ziziY + "px";
  ziziCoptere.style.transform = `rotate(${ziziAngle}deg)`;
}
function placerZiziPresDuTitre(){ // (sur le A du titre)
  if (!ziziPose || ziziCoptere.hidden) return;
  // Au départ : devant le A d'ALCUNO (par-dessus), pointe vers le bas (le dessin est horizontal, gland à droite : 90°)
  const titre = document.getElementById("titreAccueil");
  if (!titre) return;
  let r = titre.getBoundingClientRect();
  const texte = titre.firstChild; // « ALCUN » (le O est à part : span.lettreO)
  if (texte && texte.nodeType === 3 && texte.length) {
    const plage = document.createRange();
    plage.setStart(texte, 0); plage.setEnd(texte, 1); // la lettre A
    const rA = plage.getBoundingClientRect();
    // (la boîte du A comprend l'espacement des lettres, à droite : on le retire pour viser le milieu de la lettre)
    const espace = parseFloat(getComputedStyle(titre).letterSpacing) || 0;
    if (rA.width) r = { left: rA.left, top: rA.top, width: Math.max(1, rA.width - espace), height: rA.height };
  }
  if (!r.width) return; // (accueil caché)
  const taille = tailleZizi();
  ziziAngle = 90;
  // devant la lettre : centré sur le A (par-dessus)
  ziziX = Math.max(0, Math.min(largeurEcranZizi() - taille, r.left + r.width / 2 - taille / 2));
  ziziY = Math.max(0, r.top + r.height / 2 - taille / 2);
  dessinerZizi();
}
function majZiziCoptere(){
  ziziCoptere.hidden = !(ziziCoptereDebloque() && document.documentElement.dataset.theme === "donjon");
  placerZiziPresDuTitre();
}

function demarrerBoucleZizi(){
  if (ziziBoucle) return;
  ziziBoucle = true;
  ziziDernier = performance.now();
  requestAnimationFrame(pasZizi);
}
function pasZizi(maintenant){
  const dt = Math.min(0.034, Math.max(0, (maintenant - ziziDernier) / 1000)); // (onglet en arrière-plan : pas de saut)
  ziziDernier = maintenant;
  const taille = tailleZizi();
  const largeur = largeurEcranZizi(), hauteur = hauteurEcranZizi();

  // Rotation : accélère tant qu'on le tient, ralentit progressivement une fois lâché
  if (ziziTenu) ziziRotation = Math.min(ZIZI.rotationMax, ziziRotation + ZIZI.rotationTenu * dt);
  else ziziRotation *= Math.pow(ZIZI.freinRotation, dt);
  ziziAngle = (ziziAngle + ziziRotation * dt) % 360;

  let auRepos = false;
  if (!ziziTenu && !ziziPose) {
    ziziVy += ZIZI.gravite * dt;
    ziziX += ziziVx * dt;
    ziziY += ziziVy * dt;
    if (ziziX < 0) { ziziX = 0; ziziVx = Math.abs(ziziVx) * ZIZI.rebond; }
    if (ziziX > largeur - taille) { ziziX = largeur - taille; ziziVx = -Math.abs(ziziVx) * ZIZI.rebond; }
    if (ziziY < 0) { ziziY = 0; ziziVy = Math.abs(ziziVy) * ZIZI.rebond; }
    if (ziziY > hauteur - taille) {
      ziziY = hauteur - taille;
      ziziVy = -Math.abs(ziziVy) * ZIZI.rebond;
      if (Math.abs(ziziVy) < 120) ziziVy = 0; // (il ne sautille pas à l'infini)
      ziziVx *= Math.pow(Math.exp(-ZIZI.frottementSol), dt);
      if (Math.abs(ziziVx) < 8) ziziVx = 0;
    }
    auRepos = ziziVy === 0 && ziziVx === 0 && ziziY >= hauteur - taille - 0.5;
  }
  dessinerZizi();

  const fini = !ziziTenu && Math.abs(ziziRotation) < 6 && (ziziPose || auRepos);
  const cache = ziziCoptere.hidden || !ziziCoptere.getClientRects().length; // (accueil fermé : on arrête de calculer ; offsetParent est toujours vide en position fixe)
  if (fini || cache) { ziziBoucle = false; if (fini) ziziRotation = 0; return; }
  requestAnimationFrame(pasZizi);
}

(() => {
  let appui = null;
  const noter = (e) => {
    const t = performance.now();
    ziziTraces.push({ x: e.clientX, y: e.clientY, t });
    ziziTraces = ziziTraces.filter((p) => t - p.t < 100);
  };
  ziziCoptere.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { ziziCoptere.setPointerCapture(e.pointerId); } catch (err) {}
    appui = { id: e.pointerId, dx: e.clientX - ziziX, dy: e.clientY - ziziY };
    ziziTraces = [];
    noter(e);
    ziziTenu = true;
    ziziPose = false;
    ziziVx = ziziVy = 0;
    ziziRotation = Math.max(ziziRotation, 500); // il tourne dès qu'on le touche
    ziziCoptere.classList.add("zizi-tenu");
    try { navigator.vibrate && navigator.vibrate(12); } catch (err) {}
    demarrerBoucleZizi();
  });
  ziziCoptere.addEventListener("pointermove", (e) => {
    if (!appui || e.pointerId !== appui.id) return;
    const taille = tailleZizi();
    ziziX = Math.max(0, Math.min(largeurEcranZizi() - taille, e.clientX - appui.dx));
    ziziY = Math.max(0, Math.min(hauteurEcranZizi() - taille, e.clientY - appui.dy));
    noter(e);
  });
  const lacher = (e) => {
    if (!appui || (e && e.pointerId !== appui.id)) return;
    // Vitesse du lancer : déplacement du doigt sur ses ~100 dernières millisecondes
    const t = performance.now();
    const recents = ziziTraces.filter((p) => t - p.t < 100);
    if (recents.length >= 2) {
      const a = recents[0], b = recents[recents.length - 1];
      const duree = Math.max(0.016, (b.t - a.t) / 1000);
      const borne = (v) => Math.max(-ZIZI.vitesseMax, Math.min(ZIZI.vitesseMax, v));
      ziziVx = borne((b.x - a.x) / duree);
      ziziVy = borne((b.y - a.y) / duree);
    }
    ziziTenu = false;
    ziziCoptere.classList.remove("zizi-tenu");
    appui = null;
    demarrerBoucleZizi();
  };
  ziziCoptere.addEventListener("pointerup", lacher);
  ziziCoptere.addEventListener("pointercancel", lacher);
  ziziCoptere.addEventListener("contextmenu", (e) => e.preventDefault()); // (pas de menu au doigt maintenu)
})();

// Thème changé (Réglages) : html[data-theme] bouge ; fenêtre redimensionnée : il reste dans l'écran
new MutationObserver(majZiziCoptere).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
window.addEventListener("resize", () => {
  if (ziziPose) { placerZiziPresDuTitre(); return; }
  const taille = tailleZizi();
  ziziX = Math.min(ziziX, largeurEcranZizi() - taille);
  ziziY = Math.min(ziziY, hauteurEcranZizi() - taille);
  dessinerZizi();
  demarrerBoucleZizi(); // (il retombe si le bas de l'écran a bougé)
});
// (retour à l'accueil, polices chargées : le titre change de taille ou réapparaît ; lancé en l'air : il reprend sa chute)
try { new ResizeObserver(() => { placerZiziPresDuTitre(); if (!ziziPose) demarrerBoucleZizi(); }).observe(document.getElementById("titreAccueil")); } catch (e) {}
window.addEventListener("load", () => setTimeout(majZiziCoptere, 200));
majZiziCoptere();
// #endregion
