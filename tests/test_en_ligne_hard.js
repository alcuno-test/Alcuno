// Test réel du mode hard EN LIGNE, à deux « téléphones » (deux pages Playwright sans mémoire commune) : A crée, B rejoint,
// A coche le mode hard et lance ; on vérifie que les DEUX ont bien le mode hard (bandeau 18, cartes de défis), qu'ils jouent
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
  const ouvrir = async () => {
    const ctx = await nav.newContext({ viewport: { width: 390, height: 780 } });
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
    return { p, erreurs };
  };
  try {
    const A = await ouvrir(), B = await ouvrir();
    await A.p.evaluate(() => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnCreerPartie").click(); document.getElementById("pseudoCreateur").value = "TestA"; document.getElementById("validerCreation").click(); });
    await A.p.waitForFunction(() => document.getElementById("codePartieAffiche").innerText.includes(":"), null, { timeout: 30000 });
    const code = (await A.p.evaluate(() => document.getElementById("codePartieAffiche").innerText.split(": ")[1])).trim();
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
  } catch (e) { verifier(false, "exception : " + e.message); }
  await nav.close(); serveur.close();
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT EST OK");
  process.exit(echecs ? 1 : 0);
})();
