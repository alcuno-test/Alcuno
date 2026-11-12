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
  el.innerHTML = `<svg viewBox="0 0 120 60" aria-hidden="true">
    <g stroke="#5a1020" stroke-width="3" stroke-linejoin="round">
      <circle cx="22" cy="20" r="15" fill="#f2a7a0"/>
      <circle cx="22" cy="40" r="15" fill="#eb9a93"/>
      <rect x="30" y="18" width="62" height="24" rx="12" fill="#f6b8b0"/>
      <path d="M86 16 Q112 14 112 30 Q112 46 86 44 Q80 30 86 16z" fill="#e8737d"/>
    </g>
    <path d="M104 30 h6" stroke="#5a1020" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 24 Q60 21 80 24" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>
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
function placerZiziPresDuTitre(){ // (sur le O du titre)
  if (!ziziPose || ziziCoptere.hidden) return;
  // Au départ : debout sur le O d'ALCUNO, pointe vers le bas (le dessin est horizontal, gland à droite : 90°)
  const o = document.querySelector("#titreAccueil .lettreO") || document.getElementById("titreAccueil");
  if (!o) return;
  const r = o.getBoundingClientRect();
  if (!r.width) return; // (accueil caché)
  const taille = tailleZizi();
  ziziAngle = 90;
  // le bout touche le haut de la lettre (le haut du dessin de la lettre : ~18 % sous le haut de sa boîte)
  const pointe = taille * (52 / 120); // (du centre du dessin au bout du gland)
  ziziX = Math.max(0, Math.min(largeurEcranZizi() - taille, r.left + r.width / 2 - taille / 2));
  ziziY = Math.max(0, r.top + r.height * 0.18 - pointe - taille / 2);
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
