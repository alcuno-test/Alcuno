// Duel RÉFLEXE EN LIGNE, à trois « téléphones » (trois pages Playwright sans mémoire commune) : A crée, B et C rejoignent.
// Celui qui a tiré le 4 choisit « Réflexe », puis les 2 joueurs ; chacun tape l'écran de SON téléphone quand « TAPE ! »
// s'affiche (chaque téléphone tire son propre moment et mesure le temps de réaction lui-même, envoyé avec l'action).
// Vérifie : faux départ (perdu tout de suite), le plus rapide gagne (temps affichés partout), « trop lent » envoyé tout
// seul au bout de 5 s, égalité => ×2 et on rejoue, gorgées du perdant, la télé, et des états identiques partout.
// ATTENTION : ça écrit une partie de test dans la base Firebase de l'appli TEST (jamais dans le vrai jeu). Dure ~2 minutes.
//   node tests/test_reflexe_en_ligne.js
const http = require("http"), fs = require("fs"), path = require("path");
function charger(){
  for (const nom of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return require(nom); } catch (e) {} }
  console.error("Playwright est introuvable"); process.exit(2);
}
const { chromium } = charger();
const RACINE = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml",
  ".json": "application/json", ".mp3": "audio/mpeg", ".webp": "image/webp", ".gif": "image/gif" };
const serveur = http.createServer((req, res) => {
  const chemin = path.join(RACINE, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!chemin.startsWith(RACINE) || !fs.existsSync(chemin) || fs.statSync(chemin).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(chemin)] || "application/octet-stream" });
  fs.createReadStream(chemin).pipe(res);
});
let echecs = 0;
const verifier = (ok, msg) => { console.log((ok ? "OK    " : "ECHEC ") + msg); if (!ok) echecs++; };
const THEME = process.env.THEME || "bordeaux";
const CAPTURES = process.env.CAPTURES || "";
const capture = async (X, nom) => { if (CAPTURES) await X.p.screenshot({ path: path.join(CAPTURES, `reflexe_${THEME}_${nom}_${X.pseudo}.png`) }); };
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => serveur.listen(0, r));
  const url = `http://localhost:${serveur.address().port}/index.html?modetest`;
  const exe = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const nav = await chromium.launch(exe);
  const ouvrir = async (pseudo) => {
    const ctx = await nav.newContext({ viewport: { width: 390, height: 780 } });
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.addInitScript((t) => { try { localStorage.setItem("alcuno_theme", t); localStorage.setItem("alcuno_tutoriel", "vu"); } catch (e) {} }, THEME);
    await p.goto(url);
    await p.waitForFunction(() => document.getElementById("btnModeEnLigne") && window.firebaseDB, null, { timeout: 30000 });
    await p.evaluate(() => { window.alert = (m) => (window.__alertes = window.__alertes || []).push(String(m)); window.confirm = () => true; });
    return { p, erreurs, pseudo };
  };
  const pd = (P, sel, texte) => P.p.evaluate(([sel, texte]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null && (!texte || e.innerText.includes(texte)));
    if (!el) return false;
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    return true;
  }, [sel, texte || ""]);
  const lire = (P) => P.p.evaluate(() => {
    const o = document.getElementById("overlayDuel");
    const vis = (sel) => o ? [...o.querySelectorAll(sel)].filter((e) => e.offsetParent !== null) : [];
    const t = (sel) => vis(sel).map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" | ");
    return {
      ouvert: !!o, reflexe: !!(o && o.classList.contains("duel-reflexe")),
      zones: vis(".reflexe-zone").length, retournee: vis(".reflexe-signal-go").length, cartes: vis(".carte-vedette").length,
      info: t(".reflexe-signal"), temps: t(".reflexe-temps"), resultat: (vis(".shifumi-resultat")[0] || {}).innerText || "",
      titre: (o && o.querySelector(".duel-main-title") || {}).innerText || "",
      tele: typeof etatPourTele === "function" ? JSON.stringify(etatPourTele().ecran || {}) : "",
      regles: (document.getElementById("overlayRegleUnique") || {}).innerText || ""
    };
  });
  const attendreQue = async (P, test, ms = 15000) => {
    const t0 = Date.now();
    let e;
    while (Date.now() - t0 < ms) { e = await lire(P); if (test(e)) return e; await attendre(60); }
    return e;
  };

  let code = null;
  try {
    const A = await ouvrir("TestA"), B = await ouvrir("TestB"), C = await ouvrir("TestC");
    await A.p.evaluate(() => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnCreerPartie").click(); document.getElementById("pseudoCreateur").value = "TestA"; document.getElementById("validerCreation").click(); });
    await A.p.waitForFunction(() => document.getElementById("codePartieAffiche").innerText.includes(":"), null, { timeout: 30000 });
    code = (await A.p.evaluate(() => document.getElementById("codePartieAffiche").innerText.split(": ")[1])).trim();
    console.log("Partie de test créée :", code);
    for (const X of [B, C]) {
      await X.p.evaluate(([c, n]) => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnRejoindrePartie").click(); document.getElementById("codeRejoindre").value = c; document.getElementById("pseudoRejoindre").value = n; document.getElementById("validerRejoindre").click(); }, [code, X.pseudo]);
      await attendre(1500);
    }
    await A.p.waitForFunction(() => document.getElementById("lancerPartieEnLigne").style.display !== "none" && document.querySelectorAll("#listeJoueursAttente li, #listeAttente li").length !== 1, null, { timeout: 30000 }).catch(() => {});
    await attendre(1500);
    await A.p.evaluate(() => document.getElementById("lancerPartieEnLigne").click());
    const tous = [A, B, C];
    for (const X of tous) await X.p.waitForFunction(() => document.querySelectorAll("#plateau .Carte").length > 0 && joueurs.length === 3, null, { timeout: 40000 });
    verifier(true, "la manche se lance chez A, B et C (3 joueurs)");
    await attendre(1500);

    // Un duel Réflexe lancé sur les 3 téléphones (même paquet des duels) ; le tireur choisit les 2 autres
    let T, D1, D2;
    const lancer = async (carte) => {
      for (const X of tous) await X.p.evaluate((carte) => { paquetDuel.splice(0, paquetDuel.length, carte, "deux_bleu", "neuf_rouge", "cinq_jaune"); lancerOverlayChoixDuel(indexJoueur % joueurs.length, "quatre_vert"); }, carte);
      const tireur = await A.p.evaluate(() => joueurs[indexJoueur % joueurs.length]);
      T = tous.find((X) => X.pseudo === tireur);
      [D1, D2] = tous.filter((X) => X !== T);
      const types = await T.p.evaluate(() => [...document.querySelectorAll("#overlayDuel .duel-boutons .bouton-pigeon")].map((b) => b.innerText).join(" / "));
      await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", "Réflexe"); await attendre(1500);
      await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", D1.pseudo); await attendre(700);
      await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", D2.pseudo);
      const debut = await Promise.all(tous.map((X) => attendreQue(X, (e) => e.reflexe)));
      return { types, debut };
    };
    const fermer = async () => { for (const X of tous) await X.p.evaluate(async () => {
      for (let i = 0; i < 40 && (duelEnCours || document.getElementById("overlayRegleUnique")); i++) {
        if (document.getElementById("overlayRegleUnique")) fermerOverlayRegleUnique();
        await new Promise((r) => setTimeout(r, 250));
      }
    }); await attendre(1500); };
    const idx = (X) => tous.indexOf(X);

    // ===== 1) Faux départ =====
    let { types, debut } = await lancer("sept_vert");
    console.log(`Tireur : ${T.pseudo} ; duel : ${D1.pseudo} contre ${D2.pseudo}`);
    verifier(/Classique/.test(types) && /Shifumi/.test(types) && /Réflexe/.test(types), `le tireur a le choix : ${types}`);
    verifier(debut.every((e) => e.reflexe && e.cartes === 1 && e.retournee === 0), "l'écran Réflexe s'ouvre sur les 3 téléphones, avec la carte en jeu");
    verifier(debut[idx(D1)].zones === 1 && debut[idx(D2)].zones === 1 && debut[idx(T)].zones === 0, `chaque joueur du duel a sa carte à taper, celui qui regarde non (${debut.map((e) => e.zones)})`);
    verifier(/Prêts/.test(debut[idx(D1)].info) && /Réflexe en cours/.test(debut[idx(T)].info), `joueurs : « ${debut[idx(D1)].info} » ; les autres : « ${debut[idx(T)].info} »`);
    verifier(debut.every((e) => /Réflexe en cours/.test(e.tele) && !/Tape la carte/.test(e.tele)), "la télé lit « Duel Réflexe en cours... »");
    if (CAPTURES) { await attendre(800); await capture(D1, "1attente"); await capture(T, "1attente"); }
    await pd(D1, "#overlayDuel .reflexe-zone");
    let fin = await Promise.all(tous.map((X) => attendreQue(X, (e) => /gagn/.test(e.resultat))));
    verifier(fin[idx(D1)].resultat.includes(`${D1.pseudo}, tu as perdu`) && fin[idx(D2)].resultat.includes(`${D2.pseudo}, tu as gagné`) &&
      fin[idx(T)].resultat.includes(`${D1.pseudo} a perdu, ${D2.pseudo} gagne`), `faux départ : ${fin.map((e) => e.resultat.replace(/\n/g, " / ")).join(" ; ")}`);
    verifier(fin.every((e) => e.info.includes(`Faux départ de ${D1.pseudo}`) && e.temps.includes("faux départ")), "« Faux départ de … » partout");
    let boit = await Promise.all(tous.map((X) => attendreQue(X, (e) => /boit/.test(e.regles), 12000)));
    verifier(boit.every((e) => e.regles.includes(`${D1.pseudo} boit 7 gorgées`)), `le perdant boit 7 gorgées partout (${boit.map((e) => e.regles.split("\n")[0])})`);
    await fermer();

    // ===== 2) Le plus rapide gagne (chacun mesuré sur son téléphone) =====
    ({ debut } = await lancer("cinq_vert"));
    const tapApres = async (X, ms) => { const e = await attendreQue(X, (x) => x.retournee === 1, 15000); await attendre(ms); await pd(X, "#overlayDuel .reflexe-zone"); return e; };
    const [r1] = await Promise.all([tapApres(D1, 150), tapApres(D2, 900)]);
    verifier(/TAPE/.test(r1.info), `le joueur lit « ${r1.info} »`);
    fin = await Promise.all(tous.map((X) => attendreQue(X, (e) => /gagn/.test(e.resultat))));
    const tempsDe = (e, n) => Number((e.temps.match(new RegExp(n + " : (\\d+) ms")) || [])[1]);
    const t1 = tempsDe(fin[idx(T)], D1.pseudo), t2 = tempsDe(fin[idx(T)], D2.pseudo);
    verifier(fin[idx(T)].resultat.includes(`${D2.pseudo} a perdu, ${D1.pseudo} gagne`) && t1 < t2 && t2 - t1 > 400,
      `${D1.pseudo} plus rapide : ${fin[idx(T)].temps} — ${fin[idx(T)].resultat}`);
    verifier(fin.every((e) => e.temps === fin[0].temps), "les mêmes temps affichés sur les 3 téléphones");
    if (CAPTURES) for (const X of tous) await capture(X, "2resultat");
    boit = await Promise.all(tous.map((X) => attendreQue(X, (e) => /boit/.test(e.regles), 12000)));
    verifier(boit.every((e) => e.regles.includes(`${D2.pseudo} boit 5 gorgées`)), `le plus lent boit 5 gorgées partout`);
    await fermer();

    // ===== 3) Un joueur ne tape pas : « trop lent » au bout de 5 s, envoyé par son téléphone =====
    await lancer("six_vert");
    await tapApres(D1, 200);
    fin = await Promise.all(tous.map((X) => attendreQue(X, (e) => /gagn/.test(e.resultat), 20000)));
    verifier(fin.every((e) => e.resultat.includes(D1.pseudo) && e.temps.includes(`${D2.pseudo} : trop lent`)) && fin[idx(T)].resultat.includes(`${D2.pseudo} a perdu`),
      `sans tap : ${fin[idx(T)].temps} — ${fin[idx(T)].resultat}`);
    await fermer();

    // ===== 4) Égalité (même temps des deux côtés, forcé) : ×2 et on rejoue =====
    await lancer("deux_vert");
    for (const X of [D1, D2]) await X.p.evaluate(() => { const z = [...document.querySelectorAll("#overlayDuel .reflexe-zone")].find((x) => !x.hidden); z._net.charge = () => 321; });
    await Promise.all([tapApres(D1, 100), tapApres(D2, 300)]);
    const eg = await Promise.all(tous.map((X) => attendreQue(X, (e) => /Égalité/.test(e.resultat))));
    verifier(eg.every((e) => /×2/.test(e.titre)), `égalité partout : ${eg.map((e) => e.titre)} (${eg[0].temps})`);
    const m2 = await Promise.all(tous.map((X) => attendreQue(X, (e) => e.retournee === 0 && !e.resultat, 8000)));
    verifier(m2.every((e) => e.retournee === 0 && !e.resultat), "on rejoue : plus de « TAPE ! », on attend à nouveau");
    await Promise.all([tapApres(D1, 700), tapApres(D2, 150)]);
    fin = await Promise.all(tous.map((X) => attendreQue(X, (e) => /gagn/.test(e.resultat))));
    verifier(fin[idx(T)].resultat.includes(`${D1.pseudo} a perdu, ${D2.pseudo} gagne`), `2e manche : ${fin[idx(T)].temps} — ${fin[idx(T)].resultat}`);
    boit = await Promise.all(tous.map((X) => attendreQue(X, (e) => /boit/.test(e.regles), 12000)));
    verifier(boit.every((e) => e.regles.includes(`${D1.pseudo} boit 4 gorgées`)), `le perdant boit 2 × 2 = 4 gorgées partout (${boit.map((e) => e.regles.split("\n")[0])})`);
    await fermer();

    // ===== 5) Personne ne tape : on recommence, sans doubler =====
    await lancer("deux_vert");
    const pers = await Promise.all(tous.map((X) => attendreQue(X, (e) => /Personne/.test(e.info), 20000)));
    verifier(pers.every((e) => /Personne n'a tapé/.test(e.info) && !/×/.test(e.titre)), `personne ne tape : « ${pers[0].info} ${pers[0].resultat} », sans ×2 (${pers.map((e) => e.titre)})`);
    await Promise.all(tous.map((X) => attendreQue(X, (e) => e.retournee === 0 && !e.resultat, 8000)));
    await Promise.all([tapApres(D1, 150), tapApres(D2, 800)]);
    boit = await Promise.all(tous.map((X) => attendreQue(X, (e) => /boit/.test(e.regles), 15000)));
    verifier(boit.every((e) => e.regles.includes(`${D2.pseudo} boit 2 gorgées`)), `puis le plus lent boit 2 gorgées, sans multiplication (${boit.map((e) => e.regles.split("\n")[0])})`);
    await fermer();

    await attendre(2000);
    const etats = await Promise.all(tous.map((X) => X.p.evaluate(() => JSON.stringify({ j: joueurs, i: indexJoueur, duel: duelEnCours, pq: paquetDuel, g: gorgeesBues }))));
    verifier(etats.every((e) => e === etats[0]), "états identiques sur les 3 téléphones " + (etats.every((e) => e === etats[0]) ? "" : etats.join(" || ")));
    const al = await Promise.all(tous.map((X) => X.p.evaluate(() => window.__alertes || [])));
    verifier(al.every((l) => l.length === 0), "aucune alerte " + JSON.stringify(al));
    verifier(tous.every((X) => X.erreurs.length === 0), "aucune erreur JS " + JSON.stringify(tous.map((X) => X.erreurs)));
  } catch (e) { verifier(false, "exception : " + e.message); }
  if (code) { try { const r = require("child_process").spawnSync("curl", ["-s", "-m", "15", "-o", "/dev/null", "-w", "%{http_code}", "-X", "DELETE", `https://alcuno-test-default-rtdb.europe-west1.firebasedatabase.app/parties/${code}.json`], { encoding: "utf8" }); console.log(`(nettoyage de la partie ${code} : HTTP ${r.stdout})`); } catch (e) {} }
  await nav.close(); serveur.close();
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT EST OK");
  process.exit(echecs ? 1 : 0);
})();
