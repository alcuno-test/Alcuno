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

  const h2 = document.getElementById("titreReglages");
  const el = (balise, classe, texte) => { const e = document.createElement(balise); if (classe) e.className = classe; if (texte != null) e.textContent = texte; return e; };

  // Sélecteur de vue (en haut)
  const choix = el("div", "vueReglagesChoix");
  choix.id = "vueReglagesChoix";
  const labelVue = el("span", "vueReglagesLabel", "Affichage des réglages");
  choix.append(labelVue);
  const boutonsVue = [["liste", "Liste"], ["sections", "Sections"], ["tuiles", "Tuiles"]].map(([id, nom]) => {
    const b = el("button", "vueReglagesBtn", nom); b.type = "button"; b.dataset.vue = id;
    b.addEventListener("click", () => { vue = id; actif = ""; try { localStorage.setItem(CLE_VUE, id); } catch (e) {} majVue(); });
    return b;
  });
  const rangee = el("div", "vueReglagesRangee"); rangee.append(...boutonsVue); choix.append(rangee);
  h2.after(choix);

  // Tuiles
  const tuiles = el("div", "tuilesReglages"); tuiles.id = "tuilesReglages";
  GROUPES.forEach((g) => {
    const t = el("button", "tuileReglage"); t.type = "button"; t.dataset.groupe = g.id;
    t.append(el("span", "tuileIcone", g.icone), el("span", "tuileNom", g.nom));
    t.addEventListener("click", () => { actif = g.id; majVue(); ecran.scrollTop = 0; });
    tuiles.append(t);
  });
  choix.after(tuiles);

  // En-têtes de groupe (sections : titre à ouvrir / fermer ; tuiles : bouton « ← Groupe » au-dessus de la page ouverte)
  const entetes = GROUPES.map((g, i) => {
    const e = el("button", "enteteGroupe"); e.type = "button"; e.dataset.groupe = g.id; e.dataset.rang = String(i);
    e.append(el("span", "enteteIcone", g.icone), el("span", "enteteNom", g.nom), el("span", "enteteFleche", ""));
    e.addEventListener("click", () => {
      if (vue === "tuiles") { actif = ""; ecran.scrollTop = 0; }
      else if (ouverts.has(g.id)) ouverts.delete(g.id); else ouverts.add(g.id);
      majVue();
    });
    return e;
  });
  entetes.forEach((e) => contenu.append(e));

  function majVue(){
    ecran.classList.toggle("vue-sections", vue === "sections");
    ecran.classList.toggle("vue-tuiles", vue === "tuiles");
    ecran.dataset.groupeActif = vue === "tuiles" ? actif : "";
    boutonsVue.forEach((b) => b.classList.toggle("actif", b.dataset.vue === vue));
    boutonsVue.forEach((b) => b.setAttribute("aria-pressed", b.dataset.vue === vue ? "true" : "false"));
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
  // À chaque ouverture des Réglages, les tuiles reviennent à la page d'accueil
  const retour = () => { if (actif) { actif = ""; majVue(); } };
  ["btnReglages", "btnReglagesJeu"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", retour); });
})();
// #endregion
