// PARTIE BLOQUÉE EN LIGNE (js/bots.js) : trois « téléphones » (A, B, C) sur la base Firebase de l'appli TEST.
// 1) Le joueur dont c'est le tour ferme son appli : chez les autres, au bout du délai (80 s dans le jeu, raccourci ici à
//    15 s : window.__attenteBlocage), « On attend X (son tour)… » avec un seul bouton, « Remplacer par un bot ».
// 2) « Remplacer par un bot » : le bot joue pour lui tout seul (le téléphone qui l'a demandé le fait jouer) pendant que
//    les autres jouent (robot des tests) ; il est marqué 🤖 partout ; ses gorgées ne comptent pas.
// 3) Il revient avec le code : « Un bot joue à ta place » → « Reprendre la main » : plus de bot, il rejoue lui-même.
// États identiques partout, aucune erreur. ATTENTION : écrit une partie de test dans la base de l'appli TEST. ~3 min.
//   node tests/test_blocage_en_ligne.js
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

(async () => {
  await new Promise((r) => serveur.listen(0, r));
  const url = `http://localhost:${serveur.address().port}/index.html?modetest`;
  const auto = fs.readFileSync(path.join(__dirname, "auto_en_ligne.js"), "utf8");
  const exe = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const nav = await chromium.launch(exe);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const ouvrir = async (pseudo, ctxExistant) => {
    const ctx = ctxExistant || await nav.newContext({ viewport: { width: 390, height: 780 } });
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.addInitScript(() => { window.__attenteBlocage = 15000; try { localStorage.setItem("alcuno_theme", "bordeaux"); localStorage.setItem("alcuno_tutoriel", "vu"); } catch (e) {} });
    await p.goto(url);
    await p.waitForFunction(() => document.getElementById("btnModeEnLigne") && window.firebaseDB, null, { timeout: 30000 });
    await p.evaluate((a) => { window.alert = (m) => (window.__alertes = window.__alertes || []).push(String(m)); window.confirm = () => true; (0, eval)(a); }, auto);
    return { p, erreurs, ctx, pseudo };
  };
  const barre = (X) => X.p.evaluate(() => { const b = document.getElementById("barreBlocage"); return b ? b.innerText.replace(/\s+/g, " ") : ""; }).catch(() => "");
  const cliquerBarre = (X, texte) => X.p.evaluate((t) => { const b = [...document.querySelectorAll("#barreBlocage button")].find((x) => x.innerText.includes(t)); if (b) b.click(); return !!b; }, texte);
  const retournees = (X) => X.p.evaluate(() => document.querySelectorAll("#plateau .Carte.retournee").length);
  const tour = (X) => X.p.evaluate(() => joueurs[indexJoueur % joueurs.length]);
  // Ferme les annonces qui attendent un tap et répond aux défis (comme le robot) chez les présents
  const debloquer = (X) => X.p.evaluate(() => { const o = document.getElementById("overlayRegleUnique"); if (o && !o.querySelector(".bloc-hot-btn")) o.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); }).catch(() => {});
  let code = null;
  try {
    const A = await ouvrir("TestA"), B = await ouvrir("TestB"), C = await ouvrir("TestC");
    await A.p.evaluate(() => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnCreerPartie").click(); document.getElementById("pseudoCreateur").value = "TestA"; document.getElementById("validerCreation").click(); });
    await attendre(1500); await A.p.evaluate(() => { const c = document.getElementById("btnContinuerOptions"); if (c && c.getClientRects().length) c.click(); });
    await A.p.waitForFunction(() => document.getElementById("codePartieAffiche").innerText.includes(":"), null, { timeout: 30000 });
    code = (await A.p.evaluate(() => document.getElementById("codePartieAffiche").innerText.split(": ")[1])).trim();
    console.log("Partie de test créée :", code);
    for (const X of [B, C]) {
      await X.p.evaluate(([c, n]) => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnRejoindrePartie").click(); document.getElementById("codeRejoindre").value = c; document.getElementById("pseudoRejoindre").value = n; document.getElementById("validerRejoindre").click(); }, [code, X.pseudo]);
      await attendre(1500);
    }
    await attendre(2500);
    await A.p.evaluate(() => document.getElementById("lancerPartieEnLigne").click());
    let tous = [A, B, C];
    for (const X of tous) await X.p.waitForFunction(() => document.querySelectorAll("#plateau .Carte").length > 0 && joueurs.length === 3, null, { timeout: 40000 });
    await attendre(2000);

    // ----- 1) Celui dont c'est le tour part : « On attend X (son tour)… », un seul bouton « Remplacer par un bot » -----
    verifier(await A.p.evaluate(() => { const v = window.__attenteBlocage; delete window.__attenteBlocage; const d = ATTENTE_BLOCAGE(); window.__attenteBlocage = v; return d === 80000; }), "dans le jeu, la barre attend 80 s");
    const nomX = await tour(A);
    const X = tous.find((t) => t.pseudo === nomX);
    const autres = tous.filter((t) => t !== X);
    console.log(`Au tour de ${nomX} : il ferme son appli`);
    await X.p.close();
    const t0 = Date.now();
    let b = "";
    while (Date.now() - t0 < 60000) { b = await barre(autres[0]); if (b) break; await attendre(500); }
    const delai = Math.round((Date.now() - t0) / 1000);
    const boutons = await autres[0].p.evaluate(() => [...document.querySelectorAll("#barreBlocage button")].map((x) => x.innerText.trim()));
    verifier(b.includes(`On attend ${nomX}`) && b.includes("son tour") && boutons.length === 1 && boutons[0] === "Remplacer par un bot",
      `chez les autres, au bout de ${delai} s : « ${b} » (boutons : ${boutons.join(" / ")})`);
    verifier(delai >= 13, `la barre attend le délai avant d'apparaître (${delai} s pour 15 s)`);
    let b2 = ""; const tc = Date.now(); while (Date.now() - tc < 8000 && !b2) { b2 = await barre(autres[1]); if (!b2) await attendre(400); }
    verifier(b2.includes(`On attend ${nomX}`), `chez ${autres[1].pseudo} aussi : « ${b2} »`);

    // ----- 2) « Remplacer par un bot » : le bot joue pour lui pendant que les autres jouent -----
    verifier(await cliquerBarre(autres[1], "Remplacer par un bot"), `${autres[1].pseudo} touche « Remplacer par un bot »`);
    await attendre(2500);
    for (const Y of autres) await Y.p.evaluate(() => window.__auto.start());
    const bots = await Promise.all(autres.map((Y) => Y.p.evaluate((n) => estBot(n) && !!document.querySelector("#listeJoueurs .badge-bot, .badge-bot"), nomX)));
    verifier(bots.every(Boolean), `${nomX} est un bot chez les deux, avec 🤖 (${bots})`);
    const pilote = await autres[0].p.evaluate((n) => pilotesBots.get(n), nomX);
    verifier(pilote === autres[1].pseudo, `c'est ${autres[1].pseudo} qui le fait jouer (${pilote})`);
    const avant2 = await retournees(autres[0]);
    const t2 = Date.now();
    while (Date.now() - t2 < 90000 && (await retournees(autres[0])) < avant2 + 9) { for (const Y of autres) await debloquer(Y); await attendre(700); }
    const apres2 = await retournees(autres[0]);
    verifier(apres2 >= avant2 + 9, `la partie avance toute seule avec le bot (${avant2} → ${apres2} cartes, il a joué ses tours)`);
    verifier(!(await barre(autres[0])) && !(await barre(autres[1])), "plus de barre « On attend… » : le bot joue");
    for (const Y of autres) await Y.p.evaluate(() => window.__auto.stop());
    await attendre(5000);

    // ----- 3) Il revient : « Un bot joue à ta place » → « Reprendre la main » -----
    const X2 = await ouvrir(nomX, X.ctx);
    await X2.p.evaluate((c) => { document.getElementById("btnModeEnLigne").click(); document.getElementById("btnRevenirPartie").click(); document.getElementById("codeRevenir").value = c.toLowerCase(); document.getElementById("validerRevenir").click(); }, code);
    const revenu = await X2.p.waitForFunction(() => !document.getElementById("ecranRattrapage") && document.querySelectorAll("#plateau .Carte").length > 0 && partieLancee, null, { timeout: 90000 }).then(() => true, () => false);
    verifier(revenu, `${nomX} revient avec le code`);
    await attendre(2500);
    b = await barre(X2);
    verifier(/Un bot joue à ta place/.test(b) && /Reprendre la main/.test(b), `${nomX} voit « ${b} »`);
    verifier(await cliquerBarre(X2, "Reprendre la main"), `${nomX} touche « Reprendre la main »`);
    await attendre(3000);
    const plusBot = await Promise.all([X2, ...autres].map((Y) => Y.p.evaluate((n) => !estBot(n), nomX)));
    verifier(plusBot.every(Boolean), `${nomX} n'est plus un bot, partout (${plusBot})`);
    verifier(!(await barre(X2)), `plus de barre chez ${nomX}`);
    tous = [X2, ...autres];
    // la partie continue avec les 3 vrais joueurs
    for (const Y of tous) await Y.p.evaluate(() => window.__auto.start());
    const avant3 = await retournees(autres[0]); const t3 = Date.now();
    while (Date.now() - t3 < 90000 && (await retournees(autres[0])) < avant3 + 6) { for (const Y of tous) await debloquer(Y); await attendre(700); }
    verifier((await retournees(autres[0])) >= avant3 + 6, `la partie continue avec ${nomX} revenu (${avant3} → ${await retournees(autres[0])})`);
    for (const Y of tous) await Y.p.evaluate(() => window.__auto.stop());
    await attendre(6000);
    const etats = await Promise.all(tous.map((Y) => Y.p.evaluate(() => window.__etat())));
    const pareil = etats.every((e) => e === etats[0]);
    verifier(pareil, "états identiques sur les 3 téléphones");
    if (!pareil) { const o = etats.map((e) => JSON.parse(e)); for (const k of Object.keys(o[0])) if (o.some((x) => x[k] !== o[0][k])) console.log(`  différent : ${k}\n` + o.map((x, i) => `    ${tous[i].pseudo} : ${String(x[k]).slice(0, 400)}`).join("\n")); }
    const err = [A, B, C, X2].filter((Y) => Y !== X).map((Y) => Y.erreurs).flat();
    verifier(err.length === 0, "aucune erreur JS " + JSON.stringify(err));
  } catch (e) { verifier(false, "exception : " + e.message); }
  if (code) { try { const r = require("child_process").spawnSync("curl", ["-s", "-m", "15", "-o", "/dev/null", "-w", "%{http_code}", "-X", "DELETE", `https://alcuno-test-default-rtdb.europe-west1.firebasedatabase.app/parties/${code}.json`], { encoding: "utf8" }); console.log(`(nettoyage de la partie ${code} : HTTP ${r.stdout})`); } catch (e) {} }
  await nav.close(); serveur.close();
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT EST OK");
  process.exit(echecs ? 1 : 0);
})();
