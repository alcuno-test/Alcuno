// ===== Vues des Réglages : Liste (d'origine), Sections repliables, Tuiles =====
// Aucun bloc n'est déplacé dans la page (« Modifier » et « Ta partie » de js/reglages.js continuent de marcher) : chaque bloc reçoit
// un attribut data-groupe, et le CSS (style_alcuno.css, « Vues des Réglages ») les ordonne et les montre ou cache selon la vue choisie.
// Le choix est gardé sur ce téléphone (clé alcuno_reglages_vue : liste | sections | tuiles).
// #region Vues des Réglages
(function(){
  const ecran = document.getElementById("ecranReglages");
  const contenu = ecran && ecran.querySelector(".reglages-contenu");
  if (!contenu) return;
  const CLE_VUE = "alcuno_reglages_vue";
  const GROUPES = [
    { id: "affichage", nom: "Affichage", icone: "🎨", cles: ["themes", "feux-artifice", "faces-cachees", "gaucher", "accessibilite"] },
    { id: "son", nom: "Son", icone: "🔊", cles: ["sons", "musique", "vibrations", "voix"] },
    { id: "jeu", nom: "Jeu", icone: "🎮", cles: ["eau", "ecran-allume", "partie-memoire"] },
    { id: "appareil", nom: "Appareil", icone: "📱", cles: ["hors-ligne", "ecran-tele"] },
    { id: "langue", nom: "Langue", icone: "🌐", cles: ["langue"] },
    { id: "apropos", nom: "À propos", icone: "ℹ️", cles: [] } // (Partager le jeu + À propos : sans data-cle, repérés par leur classe)
  ];
  const groupeDe = (cle) => (GROUPES.find((g) => g.cles.includes(cle)) || GROUPES[2]).id; // (réglage ajouté plus tard : rangé dans « Jeu »)
  Array.from(contenu.children).forEach((el) => {
    if (el.dataset.cle) el.dataset.groupe = groupeDe(el.dataset.cle);
    else if (el.classList.contains("blocPartage") || el.classList.contains("aPropos")) el.dataset.groupe = "apropos";
  });

  const lire = () => { try { const v = localStorage.getItem(CLE_VUE); return v === "sections" || v === "tuiles" ? v : "liste"; } catch (e) { return "liste"; } };
  let vue = lire();
  let actif = ""; // tuiles : le groupe ouvert ("" = la page des tuiles)
  const ouverts = new Set(["affichage"]); // sections : les groupes ouverts
  // Changer de thème recharge la page (js/reglages.js) et rouvre les Réglages : on garde donc la tuile / les sections ouvertes (sessionStorage)
  const CLE_ETAT = "alcuno_reglages_etat";
  const idsOK = GROUPES.map((g) => g.id);
  try {
    const e = JSON.parse(sessionStorage.getItem(CLE_ETAT) || "null");
    if (e && typeof e === "object") {
      if (idsOK.includes(e.actif)) actif = e.actif;
      if (Array.isArray(e.ouverts)) { ouverts.clear(); e.ouverts.filter((i) => idsOK.includes(i)).forEach((i) => ouverts.add(i)); }
    }
  } catch (e) {}
  const sauverEtat = () => { try { sessionStorage.setItem(CLE_ETAT, JSON.stringify({ actif, ouverts: Array.from(ouverts) })); } catch (e) {} };

  const h2 = document.getElementById("titreReglages");
  const el = (balise, classe, texte) => { const e = document.createElement(balise); if (classe) e.className = classe; if (texte != null) e.textContent = texte; return e; };

  // Sélecteur de vue (en haut) : une pastille à trois cases, la case choisie glisse en douceur
  const ICONES_VUE = {
    liste: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    sections: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="6" rx="2"/><path d="M4 15h16M4 19h16"/></svg>',
    tuiles: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>'
  };
  const VUES = [["liste", "Liste"], ["sections", "Sections"], ["tuiles", "Tuiles"]];
  const choix = el("div", "vueReglagesChoix");
  choix.id = "vueReglagesChoix";
  const seg = el("div", "vueSeg"); seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Affichage des réglages");
  const pastille = el("span", "vueSegPastille"); seg.append(pastille);
  const boutonsVue = VUES.map(([id, nom]) => {
    const b = el("button", "vueSegBtn"); b.type = "button"; b.dataset.vue = id;
    b.innerHTML = ICONES_VUE[id] + "<span></span>"; b.lastChild.textContent = nom;
    b.addEventListener("click", () => {
      if (vue === id) return;
      vue = id; actif = ""; try { localStorage.setItem(CLE_VUE, id); } catch (e) {}
      majVue(); entrer(Array.from(contenu.querySelectorAll(":scope > [data-groupe]")).filter((e) => e.offsetHeight > 0));
    });
    seg.append(b); return b;
  });
  choix.append(seg);
  h2.after(choix);

  // Animations : un bloc qui apparaît glisse et se fond (en cascade) ; un bloc qui disparaît se fond d'abord. Pas d'animation si le
  // téléphone demande moins de mouvement.
  const calme = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function entrer(liste){
    if (calme()) return;
    liste.forEach((e, i) => { if (e.animate) e.animate([{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: Math.min(i, 8) * 40, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }); });
  }
  function sortir(liste, apres){
    if (calme() || !liste.length || !liste[0].animate) { apres(); return; }
    const anims = liste.map((e) => e.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px)" }], { duration: 140, easing: "ease-in", fill: "forwards" }));
    Promise.all(anims.map((a) => a.finished)).then(() => { apres(); anims.forEach((a) => a.cancel()); }, apres);
  }
  const blocsDe = (id) => Array.from(contenu.querySelectorAll(`:scope > [data-groupe="${id}"]:not(.enteteGroupe)`)).filter((e) => e.offsetHeight > 0 || !e.classList.contains("groupe-ouvert"));
  const blocsVisiblesDe = (id) => Array.from(contenu.querySelectorAll(`:scope > [data-groupe="${id}"]:not(.enteteGroupe)`)).filter((e) => e.offsetHeight > 0);

  // Tuiles
  const tuiles = el("div", "tuilesReglages"); tuiles.id = "tuilesReglages";
  GROUPES.forEach((g) => {
    const t = el("button", "tuileReglage"); t.type = "button"; t.dataset.groupe = g.id;
    t.append(el("span", "tuileIcone", g.icone), el("span", "tuileNom", g.nom));
    t.addEventListener("click", () => {
      const ancien = actif;
      const ouvrir = (id) => { actif = id; majVue(); const bl = blocsVisiblesDe(id); entrer(bl); if (bl[0]) setTimeout(() => { try { bl[0].scrollIntoView({ behavior: calme() ? "auto" : "smooth", block: "nearest" }); } catch (e) {} }, 60); };
      if (ancien === g.id) sortir(blocsVisiblesDe(ancien), () => { actif = ""; majVue(); }); // (retap : la page se referme)
      else if (ancien) sortir(blocsVisiblesDe(ancien), () => ouvrir(g.id));
      else ouvrir(g.id);
    });
    tuiles.append(t);
  });
  choix.after(tuiles);

  // En-têtes de groupe (sections : titre à ouvrir / fermer ; tuiles : bouton « ← Groupe » au-dessus de la page ouverte)
  const entetes = GROUPES.map((g, i) => {
    const e = el("button", "enteteGroupe"); e.type = "button"; e.dataset.groupe = g.id; e.dataset.rang = String(i);
    e.append(el("span", "enteteIcone", g.icone), el("span", "enteteNom", g.nom), el("span", "enteteFleche", ""));
    e.addEventListener("click", () => {
      if (ouverts.has(g.id)) { sortir(blocsVisiblesDe(g.id), () => { ouverts.delete(g.id); majVue(); }); return; }
      ouverts.add(g.id); majVue(); entrer(blocsVisiblesDe(g.id));
    });
    return e;
  });
  entetes.forEach((e) => contenu.append(e));

  function majVue(){
    ecran.classList.toggle("vue-sections", vue === "sections");
    ecran.classList.toggle("vue-tuiles", vue === "tuiles");
    ecran.dataset.groupeActif = vue === "tuiles" ? actif : "";
    boutonsVue.forEach((b) => { b.classList.toggle("actif", b.dataset.vue === vue); b.setAttribute("aria-pressed", b.dataset.vue === vue ? "true" : "false"); });
    seg.style.setProperty("--rang", String(VUES.findIndex(([id]) => id === vue)));
    tuiles.querySelectorAll(".tuileReglage").forEach((t) => t.classList.toggle("choisie", vue === "tuiles" && t.dataset.groupe === actif));
    sauverEtat();
    // Ordre d'affichage (CSS « order ») : un groupe après l'autre ; chaque bloc garde son rang d'origine dans son groupe
    GROUPES.forEach((g, i) => {
      const ouvert = vue === "sections" ? ouverts.has(g.id) : vue === "tuiles" ? actif === g.id : true;
      contenu.querySelectorAll(`:scope > [data-groupe="${g.id}"]`).forEach((e) => {
        if (e.classList.contains("enteteGroupe")) {
          e.classList.toggle("groupe-ouvert", ouvert);
          e.setAttribute("aria-expanded", ouvert ? "true" : "false");
          e.style.order = String(i * 100);
        } else {
          e.classList.toggle("groupe-ouvert", ouvert);
          e.style.order = vue === "liste" ? "" : String(i * 100 + 10);
        }
      });
    });
  }
  majVue();
  // Les tuiles et les titres de section prennent la couleur des titres des réglages du thème en cours (jaune en Bordeaux, bleu en Givre…)
  const majCouleurTitre = () => { try { const t = contenu.querySelector(".optionTitre"); if (t) ecran.style.setProperty("--titreReglage", getComputedStyle(t).color); } catch (e) {} };
  majCouleurTitre();
  try { new MutationObserver(() => setTimeout(majCouleurTitre, 50)).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] }); } catch (e) {}
  ["btnReglages", "btnReglagesJeu"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", () => setTimeout(majCouleurTitre, 0)); });
  // Réglages rouverts après un changement de thème (rechargement) : ils étaient cachés (voir le <head> de index.html) ; on les montre une
  // fois la mise en page prête et le défilement remis (js/reglages.js, à DOMContentLoaded), avec un fondu
  const montrerApresRechargement = () => {
    if (!document.documentElement.classList.contains("rouvrir-vue")) return;
    requestAnimationFrame(() => {
      ecran.classList.add("apparition-reglages");
      document.documentElement.classList.remove("rouvrir-vue");
      setTimeout(() => { ecran.classList.remove("apparition-reglages"); document.documentElement.classList.remove("rouvrir-fond"); }, 400); // (l'accueil, dessous, reste caché pendant le fondu)
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montrerApresRechargement);
  else montrerApresRechargement();
  // À chaque ouverture des Réglages, les tuiles reviennent à la page d'accueil
  const retour = () => { if (actif) { actif = ""; majVue(); } };
  ["btnReglages", "btnReglagesJeu"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", retour); });
})();
// #endregion
