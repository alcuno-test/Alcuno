// =============================================================================================
// ALCUNO : Zizi-coptère : un petit zizi qui tourne comme une hélice, à côté du titre de l'accueil
// (fichier chargé après js/reglages.js et js/regles.js dans index.html : voir l'en-tête de script.js)
// =============================================================================================
// #region Zizi-coptère
// Débloqué en finissant une partie en mode hard (récap de fin, js/regles.js ; hôte ou pas, en ligne aussi).
// Visible seulement avec le thème Donjon (BDSM), sur l'écran d'accueil (#choixMode : caché avec lui).
// Toucher : il fait quelques tours. Doigt maintenu : on le déplace partout sur l'écran, et il tourne pendant ce temps.
// Sa place n'est pas gardée : à chaque ouverture du jeu, il revient à côté du titre.
const CLE_ZIZI_COPTERE = "alcuno_zizi_coptere";
function ziziCoptereDebloque(){
  try { return localStorage.getItem(CLE_ZIZI_COPTERE) === "1"; } catch (e) { return false; }
}
function debloquerZiziCoptere(){
  if (ziziCoptereDebloque()) return;
  try { localStorage.setItem(CLE_ZIZI_COPTERE, "1"); } catch (e) {}
  majZiziCoptere();
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

let ziziDeplace = false;   // déplacé au doigt : il ne revient plus à côté du titre (jusqu'à la prochaine ouverture)
let ziziAngle = 0, ziziVitesse = 0, ziziTourne = false, ziziMaintenu = false;

function placerZiziPresDuTitre(){
  if (ziziDeplace || ziziCoptere.hidden) return;
  const titre = document.getElementById("titreAccueil");
  if (!titre) return;
  const r = titre.getBoundingClientRect();
  const taille = ziziCoptere.offsetWidth || 70;
  const x = Math.min(window.innerWidth - taille - 14, r.right - taille * 0.6);
  const y = Math.max(4, r.top - taille * 0.55);
  ziziCoptere.style.left = x + "px";
  ziziCoptere.style.top = y + "px";
}
function majZiziCoptere(){
  ziziCoptere.hidden = !(ziziCoptereDebloque() && document.documentElement.dataset.theme === "donjon");
  placerZiziPresDuTitre();
}

// Rotation : vitesse en degrés par image ; maintenu au doigt, elle monte jusqu'à un plafond ; lâché, elle ralentit
function animerZizi(){
  if (ziziMaintenu) ziziVitesse = Math.min(32, ziziVitesse + 1.2);
  else ziziVitesse *= 0.965;
  ziziAngle = (ziziAngle + ziziVitesse) % 360;
  ziziCoptere.style.transform = `rotate(${ziziAngle}deg)`;
  if (ziziMaintenu || ziziVitesse > 0.3) requestAnimationFrame(animerZizi);
  else { ziziTourne = false; ziziVitesse = 0; }
}
function lancerRotationZizi(elan){
  ziziVitesse = Math.max(ziziVitesse, elan);
  if (!ziziTourne) { ziziTourne = true; requestAnimationFrame(animerZizi); }
}

// Toucher court : quelques tours. Maintenu ~0,35 s : il se déplace avec le doigt et tourne.
(() => {
  let appui = null, minuterie = null;
  ziziCoptere.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { ziziCoptere.setPointerCapture(e.pointerId); } catch (err) {}
    const r = ziziCoptere.getBoundingClientRect();
    appui = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, x: e.clientX, y: e.clientY };
    minuterie = setTimeout(() => {
      if (!appui) return;
      ziziMaintenu = true;
      ziziDeplace = true;
      ziziCoptere.classList.add("zizi-tenu");
      try { navigator.vibrate && navigator.vibrate(15); } catch (err) {}
      lancerRotationZizi(4);
    }, 350);
  });
  ziziCoptere.addEventListener("pointermove", (e) => {
    if (!appui || e.pointerId !== appui.id) return;
    if (!ziziMaintenu) return;
    const taille = ziziCoptere.offsetWidth;
    const x = Math.max(-taille / 2, Math.min(window.innerWidth - taille / 2, e.clientX - appui.dx));
    const y = Math.max(-taille / 2, Math.min(window.innerHeight - taille / 2, e.clientY - appui.dy));
    ziziCoptere.style.left = x + "px";
    ziziCoptere.style.top = y + "px";
  });
  const fin = (e) => {
    if (!appui || (e && e.pointerId !== appui.id)) return;
    clearTimeout(minuterie);
    if (!ziziMaintenu) lancerRotationZizi(28); // toucher court : un bon élan, puis il ralentit
    ziziMaintenu = false;
    ziziCoptere.classList.remove("zizi-tenu");
    appui = null;
  };
  ziziCoptere.addEventListener("pointerup", fin);
  ziziCoptere.addEventListener("pointercancel", fin);
  ziziCoptere.addEventListener("contextmenu", (e) => e.preventDefault()); // (pas de menu au doigt maintenu)
})();

// Thème changé (Réglages) : html[data-theme] bouge ; fenêtre redimensionnée : il suit le titre
new MutationObserver(majZiziCoptere).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
window.addEventListener("resize", placerZiziPresDuTitre);
// (retour à l'accueil, polices chargées : le titre change de taille ou réapparaît)
try { new ResizeObserver(placerZiziPresDuTitre).observe(document.getElementById("titreAccueil")); } catch (e) {}
window.addEventListener("load", () => setTimeout(majZiziCoptere, 200));
majZiziCoptere();
// #endregion
