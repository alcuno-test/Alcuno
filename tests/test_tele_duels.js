// LES DUELS SHIFUMI ET RÉFLEXE SUR LA TÉLÉ, DANS TOUS LES THÈMES : node tests/test_tele_duels.js [thème1,thème2…]
// (le test lance son propre serveur web, sur le dossier du jeu qui contient ce test)
//
// Pour chaque thème, un téléphone (mode classique) joue les duels, et chaque état qu'il enverrait à la télé est dessiné
// sur une vraie page télé (index.html?tele, 1280 x 720) puis vérifié (affichage_commun.js : texte moins lisible qu'avec
// le style de base, texte qui sort de l'écran, erreur JS) :
//   - Shifumi en ligne (vu de la télé : « Duel Shifumi en cours... », puis les deux choix révélés et le résultat) ;
//   - Shifumi en classique (une carte de dos posée, puis les deux cartes retournées) ;
//   - Réflexe (« Prêts ? », « TAPE ! », résultat avec le temps de réaction).
// Vérifie aussi que rien des choix secrets ne part vers la télé avant la révélation.
// Résultat : liste des problèmes + planche des captures dans tests/resultats/tele_duels/index.html
const fs = require("fs"); const path = require("path");
const { chromium } = require("playwright");
const C = require("./affichage_commun");
const THEMES = ["bordeaux", "noir", "vert", "bleu", "soleil", "cerisier", "givre", "galaxie", "prestige", "kawaii", "donjon", "halloween",
  "noel", "valentin", "chandeleur", "patrick", "musique", "justrose"];
const choisis = (process.argv[2] || "").split(",").filter(Boolean);
const themes = choisis.length ? choisis : THEMES;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await C.demarrerServeur();
  const dossier = path.join(__dirname, "resultats", "tele_duels");
  fs.mkdirSync(dossier, { recursive: true });
  for (const f of fs.readdirSync(dossier)) if (f.endsWith(".png")) fs.unlinkSync(path.join(dossier, f));
  const b = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const problemes = []; const ecrans = [];

  for (const theme of themes) {
    // ----- Téléphone : relève les états envoyés à la télé -----
    const tel = await b.newPage({ viewport: { width: 390, height: 780 } });
    const errTel = []; tel.on("pageerror", (x) => errTel.push(x.message));
    await tel.addInitScript((t) => { try {
      localStorage.setItem("alcuno_theme", t); localStorage.setItem("alcuno_tutoriel", "vu"); localStorage.setItem("alcuno_premiere_partie_jouee", "1"); localStorage.setItem("alcuno_aide_vue", "1");
      ["alcuno_theme_prestige", "alcuno_theme_galaxie", "alcuno_theme_kawaii", "alcuno_theme_donjon"].forEach((k) => localStorage.setItem(k, "1"));
    } catch (e) {} }, theme);
    await tel.goto(C.URL_JEU, { waitUntil: "load" }); await attendre(900);
    await tel.evaluate(async () => {
      const at = (ms) => new Promise((r) => setTimeout(r, ms)); const pd = (el) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      document.querySelectorAll("#aideAccueil").forEach((e) => e.remove());
      document.getElementById("btnModeClassique").click(); await at(400);
      const c = document.getElementById("btnContinuerOptions"); if (c) c.click(); await at(400);
      for (const n of ["Tris", "Ylana"]) { document.getElementById("nomJoueur").value = n; pd(document.getElementById("ajouterJoueur")); await at(120); }
      pd(document.getElementById("jouer")); await at(1500);
    });
    const etat = () => tel.evaluate(() => JSON.parse(JSON.stringify(etatPourTele())));
    const tap = (sel, texte) => tel.evaluate(([sel, texte]) => { const el = [...document.querySelectorAll(sel)].find((e) => (!texte || e.innerText.includes(texte))); if (el) el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); return !!el; }, [sel, texte || ""]);
    const fermer = () => tel.evaluate(async () => { for (let i = 0; i < 40 && (duelEnCours || document.getElementById("overlayRegleUnique")); i++) { if (document.getElementById("overlayRegleUnique")) fermerOverlayRegleUnique(); await new Promise((r) => setTimeout(r, 200)); } });
    const etats = [];

    // Shifumi « en ligne » (l'écran des téléphones reliés : la télé ne voit que « Duel Shifumi en cours... », puis la révélation)
    await tel.evaluate(() => { paquetDuel.splice(0, paquetDuel.length, "sept_vert", "deux_bleu", "neuf_rouge", "cinq_jaune"); lancerOverlayChoixDuel(0, "quatre_vert"); });
    await attendre(300);
    await tel.evaluate(() => { const o = document.getElementById("overlayDuel"); o.innerHTML = ""; afficherOverlayShifumi(o, 0, 1); });
    await attendre(600);
    await tap('#overlayDuel .shifumi-option', "Pierre"); await attendre(400);
    const secretEnLigne = await etat();
    etats.push({ nom: "Shifumi en ligne : un joueur a choisi (secret)", e: secretEnLigne, secret: "Pierre" });
    await tel.evaluate(() => { const r = [...document.querySelectorAll("#overlayDuel .shifumi-options")][1]; const o = [...r.querySelectorAll(".shifumi-option")].find((x) => x.innerText.includes("Ciseaux")); o.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); });
    await tel.waitForFunction(() => document.querySelector("#overlayDuel.shifumi-revele"), null, { timeout: 8000 }).catch(() => {});
    await attendre(900);
    etats.push({ nom: "Shifumi en ligne : révélation et résultat", e: await etat() });
    await fermer();

    // Shifumi en classique (cartes)
    await tel.evaluate(() => { paquetDuel.splice(0, paquetDuel.length, "six_vert", "deux_bleu", "neuf_rouge", "cinq_jaune"); lancerOverlayChoixDuel(0, "quatre_vert"); });
    await attendre(300); await tap("#overlayDuel .duel-boutons .bouton-pigeon", "Shifumi"); await attendre(800);
    await tap("#overlayDuel .shifumi-option", "Feuille"); await attendre(500);
    etats.push({ nom: "Shifumi classique : une carte de dos posée", e: await etat(), secret: "Feuille" });
    await tap("#overlayDuel .shifumi-option", "Pierre");
    await tel.waitForFunction(() => document.querySelector("#overlayDuel.shifumi-revele"), null, { timeout: 8000 }).catch(() => {});
    await attendre(1200);
    etats.push({ nom: "Shifumi classique : cartes retournées", e: await etat() });
    await fermer();

    // Réflexe
    await tel.evaluate(() => { paquetDuel.splice(0, paquetDuel.length, "huit_vert", "deux_bleu", "neuf_rouge", "cinq_jaune"); lancerOverlayChoixDuel(0, "quatre_vert"); });
    await attendre(300); await tap("#overlayDuel .duel-boutons .bouton-pigeon", "Réflexe"); await attendre(700);
    etats.push({ nom: "Réflexe : Prêts ?", e: await etat() });
    await tel.waitForFunction(() => document.querySelector("#overlayDuel .reflexe-signal-go"), null, { timeout: 12000 }).catch(() => {});
    await attendre(200);
    etats.push({ nom: "Réflexe : TAPE !", e: await etat() });
    await attendre(150); await tap("#overlayDuel .reflexe-zone-haut");
    await attendre(700);
    etats.push({ nom: "Réflexe : résultat", e: await etat() });
    await fermer();
    errTel.forEach((m) => problemes.push(`${theme} · téléphone : ERREUR JS ${m}`));
    await tel.close();

    // ----- Télé : chaque état dessiné et vérifié -----
    const tv = await b.newPage({ viewport: { width: 1280, height: 720 } });
    const errTv = []; tv.on("pageerror", (x) => errTv.push(x.message));
    await tv.addInitScript(C.scriptMesure());
    await tv.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}"; document.head.appendChild(s); }));
    await tv.goto(C.URL_JEU + "?tele", { waitUntil: "load" }); await attendre(1000);
    for (const [k, { nom, e, secret }] of etats.entries()) {
      const debut = errTv.length;
      const complet = Object.assign(JSON.parse(JSON.stringify(e)), { theme, voix: 0, musique: 0, sons: [], envols: [], rappel: null, eau: null });
      // (la page télé du test, sans téléphone relié, peut se remettre d'elle-même sur son écran d'attente : on redessine
      // l'état juste avant de le vérifier et de le capturer)
      const dessiner = async () => {
        for (let i = 0; i < 5; i++) {
          await tv.evaluate((x) => dessinerTele(document.getElementById("ecranTele"), x), complet);
          await attendre(350);
          if (await tv.evaluate(() => document.querySelector("#ecranTele .tele-attente").hidden)) return true;
        }
        return false;
      };
      if (!(await dessiner())) problemes.push(`${theme} · ${nom} : la télé reste sur l'écran d'attente`);
      const r = await C.verifierEcran(tv, theme, "tele", false);
      await dessiner();
      const texte = await tv.evaluate(() => { const o = document.querySelector("#ecranTele .tele-ecran"); return o && !o.hidden ? o.innerText.replace(/\s+/g, " ") : ""; });
      if (secret && texte.includes(secret)) r.problemes.push(`SECRET VISIBLE  « ${secret} » se voit sur la télé avant la révélation`);
      errTv.slice(debut).forEach((m) => r.problemes.push(`ERREUR JS      ${m}`));
      const image = `${theme}_${k}.png`;
      await tv.screenshot({ path: path.join(dossier, image) });
      r.problemes.forEach((p) => problemes.push(`${theme} · ${nom} : ${p}`));
      ecrans.push({ nom: `${theme} · ${nom}`, problemes: r.problemes, images: [image], texte });
    }
    await tv.close();
    console.log(`${theme} : ${etats.length} écrans télé vérifiés`);
  }
  await b.close(); C.arreterServeur();
  try { C.ecrirePlanche(dossier, "Duels sur la télé", ecrans); } catch (e) {}
  console.log("");
  problemes.forEach((p) => console.log(p));
  console.log(`\n${ecrans.length} écrans télé vérifiés. Captures : ${dossier}`);
  console.log(problemes.length ? `${problemes.length} PROBLÈME(S)` : "TOUT EST OK");
  process.exit(problemes.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
