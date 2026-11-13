// Test réel du mode hard EN LIGNE, à deux « téléphones » (deux pages Playwright sans mémoire commune) : A crée, B rejoint,

// (tests/auto_en_ligne.js + clic sur « Je le fais » / « Je bois »), que leurs états restent identiques, et qu'il n'y a aucune erreur.
// ATTENTION : ça écrit une partie de test dans la base Firebase de l'appli TEST (jamais dans le vrai jeu). Dure 1 à 3 minutes.
//   node tests/test_en_ligne_hard.js
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
const OBJECTIF = 12; // cartes retournées à atteindre

(async () => {
  await new Promise((r) => serveur.listen(0, r));
  const url = `http://localhost:${serveur.address().port}/index.html?modetest`;
  const auto = fs.readFileSync(path.join(__dirname, "auto_en_ligne.js"), "utf8");
  const exe = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const nav = await chromium.launch(exe);
  const ouvrir = async (ctxExistant) => {
    const ctx = ctxExistant || await nav.newContext({ viewport: { width: 390, height: 780 } });
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem("alcuno_hard_debloque", "1"); localStorage.setItem("alcuno_theme", "bordeaux"); } catch (e) {} });
    await p.goto(url);
    await p.waitForFunction(() => document.getElementById("btnModeEnLigne") && window.firebaseDB, null, { timeout: 30000 });
    await p.evaluate((a) => {
      window.alert = (m) => (window.__alertes = window.__alertes || []).push(String(m)); window.confirm = () => true;
      (0, eval)(a);
      // (en plus du robot en ligne : les défis du mode hard, « Je le fais » puis « Je bois » en alternance)
      let n = 0; setInterval(() => {
        if (!window.__defisActifs) return;
        const bs = Array.from(document.querySelectorAll("#overlayRegleUnique .bloc-hot-btn")).filter((b) => !b.disabled);
        if (bs.length) bs[n++ % bs.length].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      }, 350);
    }, auto);
    return { p, erreurs, ctx };
  };
  let code = null;
  try {
    const A = await ouvrir(), B = await ouvrir();
    await A.p.evaluate(() => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnCreerPartie").click(); document.getElementById("pseudoCreateur").value = "TestA"; document.getElementById("validerCreation").click(); });
    await A.p.waitForFunction(() => document.getElementById("codePartieAffiche").innerText.includes(":"), null, { timeout: 30000 });
    code = (await A.p.evaluate(() => document.getElementById("codePartieAffiche").innerText.split(": ")[1])).trim();
    console.log("Partie de test créée :", code);
    await B.p.evaluate((c) => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnRejoindrePartie").click(); document.getElementById("codeRejoindre").value = c; document.getElementById("pseudoRejoindre").value = "TestB"; document.getElementById("validerRejoindre").click(); }, code);
    await A.p.waitForFunction(() => document.getElementById("lancerPartieEnLigne").style.display !== "none", null, { timeout: 30000 });
    const hard = (P) => P.evaluate(() => typeof estModeHard === "function" && estModeHard() && document.body.classList.contains("partie-hard"));
    verifier(!(await hard(B.p)), "(contrôle) B n'est pas en mode hard avant le lancement : le contrôle sait répondre non");
    // A coche le mode hard (case « Ta partie »), puis lance
    await A.p.evaluate(() => { const c = document.getElementById("optionModeHard"); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); });
    await A.p.evaluate(() => document.getElementById("lancerPartieEnLigne").click());
    const cartes = (P) => P.waitForFunction(() => document.querySelectorAll("#plateau .Carte").length > 0, null, { timeout: 40000 }).then(() => true, () => false);
    verifier((await cartes(A.p)) && (await cartes(B.p)), "la manche se lance chez A et chez B");
    verifier((await hard(A.p)) && (await hard(B.p)), "mode hard actif chez A ET chez B (le choix voyage dans la graine)");
    const nb = (P) => P.evaluate(() => document.querySelectorAll("#plateau .Carte").length);
    const [nA, nB] = [await nb(A.p), await nb(B.p)];
    verifier(nA === nB && nA > 0, `même paquet des deux côtés (${nA} / ${nB} cartes)`);
    const cupidon = (P) => P.evaluate(() => Array.from(document.querySelectorAll("#plateau .Carte")).some((c) => /cupidon/i.test(c.className)));
    verifier(!(await cupidon(A.p)) && !(await cupidon(B.p)), "pas de carte Cupidon en hard");
    // Les deux jouent
    for (const P of [A.p, B.p]) await P.evaluate(() => { window.__defisActifs = true; window.__auto.start(); });
    const t0 = Date.now(); let flip = 0;
    while (Date.now() - t0 < 240000) {
      flip = await A.p.evaluate(() => document.querySelectorAll("#plateau .Carte.retournee").length);
      if (flip >= OBJECTIF) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    verifier(flip >= OBJECTIF, `la partie avance (${flip} cartes retournées sur ${nA}, objectif ${OBJECTIF})`);
    for (const P of [A.p, B.p]) await P.evaluate(() => window.__auto.stop());
    await new Promise((r) => setTimeout(r, 6000));
    const [eA, eB] = [await A.p.evaluate(() => window.__etat()), await B.p.evaluate(() => window.__etat())];
    verifier(eA === eB, "états identiques chez A et B après 6 s de calme" + (eA === eB ? "" : "\n  A : " + eA.slice(0, 300) + "\n  B : " + eB.slice(0, 300)));
    const al = [await A.p.evaluate(() => window.__alertes || []), await B.p.evaluate(() => window.__alertes || [])];
    verifier(al.every((l) => l.length === 0), "aucune alerte du jeu " + JSON.stringify(al));
    verifier(A.erreurs.length === 0 && B.erreurs.length === 0, "aucune erreur JS " + JSON.stringify([A.erreurs, B.erreurs]));

    // ----- Départ en plein défi : celui qui doit répondre au défi ferme sa page, puis revient avec le code -----
    // (les défis ne sont plus cliqués par le robot : le premier téléphone qui affiche « Je le fais / Je bois » est fermé)
    for (const P of [A.p, B.p]) await P.evaluate(() => { window.__defisActifs = false; window.__auto.start(); });
    const boutonsDefi = (P) => P.evaluate(() => Array.from(document.querySelectorAll("#overlayRegleUnique .bloc-hot-btn")).some((b) => !b.disabled && b.offsetParent !== null)).catch(() => false);
    let parti = null; const t1 = Date.now();
    while (!parti && Date.now() - t1 < 150000) {
      for (const [nom, X] of [["A", A], ["B", B]]) if (!parti && await boutonsDefi(X.p)) parti = [nom, X];
      if (!parti) await new Promise((r) => setTimeout(r, 400));
    }
    verifier(!!parti, "un défi hard s'affiche pendant la partie" + (parti ? ` (chez ${parti[0]})` : ""));
    if (parti) {
      const [nomP, P] = parti, reste = nomP === "A" ? B : A;
      await P.p.close();
      await new Promise((r) => setTimeout(r, 3000));
      const P2 = await ouvrir(P.ctx); // (même « téléphone » : se souvient du pseudo)
      await P2.p.evaluate((c) => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnRevenirPartie").click(); document.getElementById("codeRevenir").value = c.toLowerCase(); document.getElementById("validerRevenir").click(); }, code);
      const revenu = await P2.p.waitForFunction(() => !document.getElementById("ecranRattrapage") && document.querySelectorAll("#plateau .Carte").length === 52, null, { timeout: 90000 }).then(() => true, () => false);
      verifier(revenu, `${nomP} revient avec le code : la partie se recharge (52 cartes)`);
      verifier(await P2.p.evaluate(() => typeof estModeHard === "function" && estModeHard() && document.body.classList.contains("partie-hard")), `${nomP} revenu : toujours en mode hard`);
      await new Promise((r) => setTimeout(r, 4000));
      const avant = await reste.p.evaluate(() => document.querySelectorAll("#plateau .Carte.retournee").length);
      // La partie reprend : on remet le robot (défis compris) des deux côtés
      for (const X of [reste.p, P2.p]) await X.evaluate(() => { window.__defisActifs = true; window.__auto.start(); });
      const t2 = Date.now(); let apres = avant;
      while (Date.now() - t2 < 180000) {
        apres = await reste.p.evaluate(() => document.querySelectorAll("#plateau .Carte.retournee").length);
        if (apres >= avant + 6) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      verifier(apres >= avant + 6, `la partie continue après le retour (${avant} -> ${apres} cartes)`);
      for (const X of [reste.p, P2.p]) await X.evaluate(() => window.__auto.stop());
      await new Promise((r) => setTimeout(r, 6000));
      const [e1, e2] = [await reste.p.evaluate(() => window.__etat()), await P2.p.evaluate(() => window.__etat())];
      verifier(e1 === e2, "états identiques après le retour" + (e1 === e2 ? "" : "\n  reste : " + e1.slice(0, 300) + "\n  revenu : " + e2.slice(0, 300)));
      verifier(reste.erreurs.length === 0 && P2.erreurs.length === 0, "aucune erreur JS après le retour " + JSON.stringify([reste.erreurs, P2.erreurs]));
    }
  } catch (e) { verifier(false, "exception : " + e.message); }
  // (nettoyage : la partie de test est effacée de la base si les règles le permettent)
  if (code) { try { const r = require("child_process").spawnSync("curl", ["-s", "-m", "15", "-o", "/dev/null", "-w", "%{http_code}", "-X", "DELETE", `https://alcuno-test-default-rtdb.europe-west1.firebasedatabase.app/parties/${code}.json`], { encoding: "utf8" }); console.log(`(nettoyage de la partie ${code} : HTTP ${r.stdout})`); } catch (e) {} }
  await nav.close(); serveur.close();
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT EST OK");
  process.exit(echecs ? 1 : 0);
})();
