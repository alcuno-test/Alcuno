// Bots (js/bots.js) : ajout, tour joué tout seul, gorgées perdues (jamais comptées), pari de fin, pas en mode hard.
// Le jeu doit être servi (comme les autres tests navigateur) : URL_JEU, par défaut http://localhost:8765/index.html
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const URL = process.env.URL_JEU || "http://localhost:8765/index.html";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  await p.addInitScript(() => { try { localStorage.removeItem("alcuno_bots"); } catch (e) {} });
  await p.goto(URL);
  await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    const $ = (s) => document.querySelector(s);
    const pd = (el) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const res = {};
    $("#btnModeClassique").click();
    if ($("#btnContinuerOptions")) $("#btnContinuerOptions").click();
    $("#nomJoueur").value = "Léa"; pd($("#ajouterJoueur"));
    // mode hard : pas de bouton
    caseModeHard.checked = true; caseModeHard.dispatchEvent(new Event("change"));
    res.cacheEnHard = $("#ajouterBot").style.display === "none";
    caseModeHard.checked = false; caseModeHard.dispatchEvent(new Event("change"));
    res.visibleSansHard = $("#ajouterBot").style.display !== "none";
    // confirmation : « Non » n'ajoute rien, « Oui » ajoute le bot proposé
    $("#ajouterBot").click();
    res.question = $("#titreConfirmerBot").innerText;
    $("#btnConfirmerBotNon").click();
    res.apresNon = joueurs.length;
    $("#ajouterBot").click();
    const propose = $("#titreConfirmerBot").innerText;
    $("#btnConfirmerBotOui").click();
    res.bot = joueurs[1];
    res.ajouteCeluiPropose = propose.includes(res.bot) && $("#ecranConfirmerBot").style.display === "none";
    res.estBot = estBot(res.bot);
    res.badge = !!$("#listeJoueurs .badge-bot");
    res.jouerVisible = $("#jouer").style.display !== "none";
    // gorgées d'un bot : jamais comptées
    noterGorgees(res.bot, 5);
    res.gorgeesBot = gorgeesBues[res.bot] || 0;
    pd($("#jouer"));
    await attendre(1200);
    res.boutonCacheEnPartie = $("#ajouterBot").style.display === "none";
    // tour du bot : il retourne une carte tout seul
    indexJoueur = 1;
    afficherJoueurActif();
    const avant = document.querySelectorAll("#plateau .Carte.retournee").length;
    for (let i = 0; i < 40 && document.querySelectorAll("#plateau .Carte.retournee").length === avant; i++) await attendre(100);
    res.carteTireeParLeBot = document.querySelectorAll("#plateau .Carte.retournee").length > avant;
    // pari de fin : le bot parie tout seul quand c'est à lui
    for (let i = 0; i < 60 && (overlayOuvert() || document.getElementById("overlayRegleUnique")); i++) {
      const o = document.getElementById("overlayRegleUnique"); if (o) pd(o);
      [...document.querySelectorAll("[data-net-id]")].filter((el) => !el.closest("#plateau") && el._net && !estBot(proprietaire(el)) && actionPrete(el)).slice(0, 1).forEach((el) => el._net.evenement === "click" ? el.click() : pd(el));
      await attendre(300);
    }
    document.querySelectorAll("[id^=overlay]").forEach((o) => o.remove());
    predictionEnCours = false; choixPigeonEnCours = false; duelEnCours = false;
    paquet.length = 1; carteDoreeEnJeu = false;
    lancerOverlayPrediction(1);
    for (let i = 0; i < 40 && predictions[1].typeId === null; i++) await attendre(100);
    res.pariDuBot = predictions[1].typeId;
    // pas de bot en mode hard
    return res;
  });
  assert.ok(r.cacheEnHard && r.visibleSansHard, "« Ajouter un bot » caché en mode hard");
  assert.match(r.question, /^Ajouter le bot .+ à la partie \?$/, "question de confirmation avec le prénom");
  assert.equal(r.apresNon, 1, "« Non » : pas de bot ajouté");
  assert.ok(r.ajouteCeluiPropose, "« Oui » : le bot proposé est ajouté");
  assert.ok(r.estBot && r.badge, "bot ajouté, avec sa pastille 🤖");
  assert.ok(r.jouerVisible, "1 joueur + 1 bot : on peut lancer la partie");
  assert.equal(r.gorgeesBot, 0, "les gorgées d'un bot ne comptent pas");
  assert.ok(r.boutonCacheEnPartie, "« Ajouter un bot » caché en partie");
  assert.ok(r.carteTireeParLeBot, "le bot joue son tour tout seul");
  assert.ok(r.pariDuBot, "le bot parie tout seul au pari de fin");
  assert.deepEqual(erreurs, [], "aucune erreur dans la page");

  // Textes : refile et gorgées perdues
  const fs = require("node:fs"), path = require("node:path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "bots.js"), "utf8");
  assert.ok(src.includes("s'en bat les couilles"), "message du bot qui refile ses gorgées");
  assert.ok(fs.readFileSync(path.join(__dirname, "..", "js", "regles.js"), "utf8").includes("Pas de bot en mode hard"), "pas de bot en mode hard");
  console.log(`Bots : ${r.bot} ajouté, joue son tour, parie (${r.pariDuBot}), ne boit pas.`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
