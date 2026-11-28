// Duel Shifumi EN LIGNE, à trois « téléphones » (trois pages Playwright sans mémoire commune) : A crée, B et C rejoignent.
// Celui qui a tiré le 4 choisit « Shifumi », puis les 2 joueurs du duel ; chacun des 2 choisit sur SON téléphone (les autres
// ne voient que « {nom} fait son choix »), égalité => ×2 et on rejoue, puis le perdant boit les gorgées de la carte tirée.
// Vérifie aussi que rien du choix secret ne part vers la télé avant la révélation.
// ATTENTION : ça écrit une partie de test dans la base Firebase de l'appli TEST (jamais dans le vrai jeu). Dure ~1 minute.
//   node tests/test_shifumi_en_ligne.js
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
const capture = async (X, nom) => { if (CAPTURES) await X.p.screenshot({ path: path.join(CAPTURES, `shifumi_${THEME}_${nom}_${X.pseudo}.png`) }); };
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
    return {
      ouvert: !!o,
      shifumi: !!(o && o.classList.contains("duel-shifumi")),
      options: vis(".shifumi-option").length,
      info: (vis(".shifumi-info")[0] || {}).innerText || "",
      statuts: vis(".shifumi-statut").map((s) => s.innerText).join(" | "),
      monChoix: (vis(".shifumi-mon-choix")[0] || {}).innerText || "",
      resultat: (vis(".shifumi-resultat")[0] || {}).innerText || "",
      titre: (o && o.querySelector(".duel-main-title") || {}).innerText || "",
      revele: vis(".shifumi-revele-joueur").map((b) => b.innerText.replace(/\s+/g, " ")).join(" | "),
      tele: typeof etatPourTele === "function" ? JSON.stringify(etatPourTele().ecran || {}) : "",
      regles: (document.getElementById("overlayRegleUnique") || {}).innerText || ""
    };
  });
  const attendreQue = async (P, test, ms = 15000) => {
    const t0 = Date.now();
    let e;
    while (Date.now() - t0 < ms) { e = await lire(P); if (test(e)) return e; await attendre(200); }
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

    // Un 4 vient d'être tiré : même duel lancé sur les 3 téléphones (même paquet des duels : un 7 en jeu)
    const tireur = await A.p.evaluate(() => joueurs[indexJoueur % joueurs.length]);
    for (const X of tous) await X.p.evaluate(() => { paquetDuel.splice(0, paquetDuel.length, "sept_vert", "deux_bleu", "neuf_rouge"); lancerOverlayChoixDuel(indexJoueur % joueurs.length, "quatre_vert"); });
    const T = tous.find((X) => X.pseudo === tireur);
    const [D1, D2] = tous.filter((X) => X !== T); // (les 2 autres s'affrontent ; le tireur regarde)
    console.log(`Tireur : ${T.pseudo} ; duel : ${D1.pseudo} contre ${D2.pseudo}`);
    verifier(await T.p.evaluate(() => [...document.querySelectorAll("#overlayDuel .duel-boutons .bouton-pigeon")].map((b) => b.innerText).join("/").includes("Shifumi")), "le tireur peut choisir « Classique » ou « Shifumi »");
    verifier(await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", "Shifumi"), "le tireur choisit Shifumi");
    await attendre(1500);
    await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", D1.pseudo); await attendre(700);
    await pd(T, "#overlayDuel .duel-boutons .bouton-pigeon", D2.pseudo);

    const debut = await Promise.all(tous.map((X) => attendreQue(X, (e) => e.shifumi && e.statuts)));
    verifier(debut.every((e) => e.shifumi), "l'écran Shifumi s'ouvre sur les 3 téléphones");
    verifier(debut[tous.indexOf(D1)].options === 3 && debut[tous.indexOf(D2)].options === 3, `chaque joueur du duel voit ses 3 choix, pas ceux de l'autre (${debut.map((e) => e.options)})`);
    verifier(debut[tous.indexOf(T)].options === 0 && /Shifumi en cours/.test(debut[tous.indexOf(T)].info), `celui qui regarde : aucun choix, « Duel Shifumi en cours... » (${debut[tous.indexOf(T)].info})`);
    verifier(debut.every((e) => e.statuts.includes(`${D1.pseudo} fait son choix`) && e.statuts.includes(`${D2.pseudo} fait son choix`)), "partout : « {nom} fait son choix… » pour les deux");
    const carte = await T.p.evaluate(() => [...document.querySelectorAll("#overlayDuel .carte-vedette")].map((c) => c.className).join(" "));
    verifier(/sept_vert/.test(carte), `la carte tirée du paquet des duels est affichée en haut (${carte})`);

    if (process.env.DEBUG) console.log(await D1.p.evaluate(() => { const out = []; let el = document.querySelector("#overlayDuel .shifumi-options:not([hidden])"); while (el && el !== document.body) { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); out.push(`${el.className||el.id} x=${b.x|0} w=${b.width|0} disp=${cs.display} ai=${cs.alignItems} as=${cs.alignSelf} ov=${cs.overflowX}`); el = el.parentElement; } return out.join("\n"); }));
    if (CAPTURES) { await attendre(1200); await capture(D1, "1choix"); await capture(T, "1choix"); }
    // Manche 1 : pierre contre pierre => égalité, ×2
    verifier(await pd(D1, "#overlayDuel .shifumi-option", "Pierre"), `${D1.pseudo} choisit Pierre`);
    const apres1 = await attendreQue(T, (e) => e.statuts.includes(`${D1.pseudo} a choisi`));
    verifier(apres1.statuts.includes(`${D1.pseudo} a choisi`) && !/pierre|✊/i.test(apres1.statuts + apres1.info + apres1.revele), "le tireur voit « a choisi ✓ », pas le choix");
    const d1 = await lire(D1);
    verifier(!/En attente/.test(d1.tele), "la télé lit « Duel Shifumi en cours... », pas « En attente de … »");
    verifier(d1.options === 0 && /Pierre/.test(d1.monChoix), `${D1.pseudo} voit son choix, plus les boutons (${d1.monChoix})`);
    verifier(!/Pierre|✊/.test(d1.tele), `rien du choix secret dans ce que ${D1.pseudo} enverrait à la télé (${d1.tele.slice(0, 200)})`);
    await capture(D1, "2attente");
    const d2 = await lire(D2);
    verifier(d2.options === 3 && !/Pierre|✊/.test(d2.monChoix + d2.statuts + d2.info), `${D2.pseudo} ne voit pas le choix de ${D1.pseudo}`);
    await pd(D2, "#overlayDuel .shifumi-option", "Pierre");
    const egalite = await Promise.all(tous.map((X) => attendreQue(X, (e) => /Égalité/.test(e.resultat))));
    verifier(egalite.every((e) => /Égalité/.test(e.resultat) && /×2/.test(e.titre)), `égalité partout, gorgées ×2 (${egalite.map((e) => e.titre)})`);

    // Manche 2 : feuille contre pierre => D1 gagne
    const m2 = await Promise.all([D1, D2].map((X) => attendreQue(X, (e) => e.options === 3)));
    verifier(m2.every((e) => e.options === 3), "après l'égalité, on rejoue : les 3 choix reviennent");
    await pd(D2, "#overlayDuel .shifumi-option", "Pierre"); await attendre(400);
    await pd(D1, "#overlayDuel .shifumi-option", "Feuille");
    const fin = await Promise.all(tous.map((X) => attendreQue(X, (e) => /gagn/.test(e.resultat))));
    for (const X of tous) await capture(X, "3resultat");
    const [fT, f1, f2] = [fin[tous.indexOf(T)], fin[tous.indexOf(D1)], fin[tous.indexOf(D2)]];
    verifier(f2.resultat.includes(`${D2.pseudo}, tu as perdu`) && f2.resultat.includes(`${D1.pseudo} gagne`), `perdant : « ${f2.resultat.replace(/\n/g, " / ")} »`);
    verifier(f1.resultat.includes(`${D1.pseudo}, tu as gagné`) && f1.resultat.includes(`${D2.pseudo} perd`), `gagnant : « ${f1.resultat.replace(/\n/g, " / ")} »`);
    verifier(fT.resultat.includes(`${D2.pseudo} a perdu, ${D1.pseudo} gagne`), `les autres : « ${fT.resultat} »`);
    verifier(fin.every((e) => /✋/.test(e.revele) && /✊/.test(e.revele) && !/Pierre|Feuille/.test(e.revele)), "les deux choix révélés partout (emojis, sans les mots)");
    const teleRevele = JSON.parse(fin[0].tele);
    verifier(Array.isArray(teleRevele.shifumi) && teleRevele.shifumi.map((j) => j.e).sort().join("") === ["✊", "✋"].sort().join(""), `la télé reçoit les deux choix révélés (${JSON.stringify(teleRevele.shifumi)})`);
    verifier(f1.tele.includes(`${D2.pseudo} a perdu, ${D1.pseudo} gagne`) && !f1.tele.includes("tu as"), "la télé lit le résultat neutre, même depuis le téléphone d'un joueur du duel");
    const boit = await Promise.all(tous.map((X) => attendreQue(X, (e) => /boit/.test(e.regles), 12000)));
    verifier(boit.every((e) => e.regles.includes(`${D2.pseudo} boit 14 gorgées`)), `le perdant boit 7 × 2 = 14 gorgées partout (${boit.map((e) => e.regles.split("\n")[0])})`);
    await attendre(3000);
    const etats = await Promise.all(tous.map((X) => X.p.evaluate(() => JSON.stringify({ j: joueurs, i: indexJoueur, duel: duelEnCours, pq: paquetDuel }))));
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
