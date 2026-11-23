// Tutoriel du premier lancement (js/tutoriel.js) : s'ouvre tout seul pour un nouveau joueur, se joue jusqu'au bout
// (carte retournée, joueur suivant, doigt appuyé => règle, prénom => pause, dernière carte), « Passer » à tout moment,
// bouton retour du téléphone, « 🎓 Tutoriel » dans les Règles. Jamais tout seul pour un ancien joueur.
// Le jeu doit être servi (comme les autres tests navigateur) : URL_JEU, par défaut http://localhost:8765/index.html
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const URL = process.env.URL_JEU || "http://localhost:8765/index.html";

async function ouvrir(b, stockage){
  const p = await b.newPage({ viewport: { width: 390, height: 780 } });
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  await p.addInitScript((s) => { try { if (!sessionStorage.getItem("deja")) { sessionStorage.setItem("deja", "1"); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } } catch (e) {} }, stockage);
  await p.goto(URL);
  await p.waitForTimeout(1500);
  return { p, erreurs };
}
const ouvert = (p) => p.evaluate(() => !!document.getElementById("tutoriel") && !document.getElementById("tutoriel").classList.contains("tuto-sortie"));
const titre = (p) => p.evaluate(() => document.querySelector("#tutoriel .voletPause-nom").textContent);
const ok = (p) => p.click("#tutoriel .voletPause-ok");

(async () => {
  const b = await chromium.launch();

  // ----- nouveau joueur : tout le tutoriel, puis les flèches vers les Règles et les Réglages
  const { p, erreurs } = await ouvrir(b, { alcuno_tutoriel: "a_voir" });
  assert.ok(await ouvert(p), "s'ouvre tout seul pour un nouveau joueur");
  assert.equal(await titre(p), "Bienvenue dans Alcuno !");
  await ok(p);
  assert.equal(await titre(p), "À ton tour");
  assert.equal(await p.locator("#tutoriel .tuto-boutons button").count(), 0, "il faut toucher une carte pour continuer");
  await p.click("#tutoriel .tuto-plateau .Carte:nth-child(3)");
  await p.waitForTimeout(500);
  assert.ok(await p.evaluate(() => document.querySelector("#tutoriel .tuto-plateau .Carte:nth-child(3)").classList.contains("plus_2_jaune")), "la carte touchée est retournée");
  assert.equal(await titre(p), "+2");
  assert.match(await p.evaluate(() => document.querySelector("#tutoriel .voletPause-texte").textContent), /Tu bois 2 gorgées/);
  await ok(p);
  assert.equal(await titre(p), "Au tour de Léa");
  assert.ok(await p.evaluate(() => document.querySelectorAll("#tutoriel .tuto-joueur")[1].classList.contains("actif")), "Léa est le joueur actif");
  const deja = await (await p.$("#tutoriel .tuto-plateau .Carte:nth-child(3)")).boundingBox();
  await p.mouse.click(deja.x + 20, deja.y + 30); // (déjà retournée : rien)
  assert.equal(await titre(p), "Au tour de Léa");
  await p.click("#tutoriel .tuto-plateau .Carte:nth-child(6)");
  await p.waitForTimeout(500);
  assert.match(await p.evaluate(() => document.querySelector("#tutoriel .voletPause-texte").textContent), /sauf Léa/);
  await ok(p);
  assert.equal(await titre(p), "Un trou de mémoire ?");
  const r = await (await p.$("#tutoriel .tuto-plateau .Carte:nth-child(6)")).boundingBox();
  await p.mouse.move(r.x + 20, r.y + 30); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
  await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => document.querySelector("#voletCarte .voletPause-nom") && document.querySelector("#voletCarte .voletPause-nom").textContent), "0", "doigt appuyé : le vrai volet de la règle");
  await p.mouse.click(195, 100);
  await p.waitForTimeout(400);
  assert.ok(await p.evaluate(() => !document.getElementById("voletCarte")), "volet refermé");
  await ok(p);
  assert.equal(await titre(p), "Une pause ?");
  await p.click("#tutoriel .tuto-joueur:nth-child(3)");
  assert.ok(await p.evaluate(() => document.querySelectorAll("#tutoriel .tuto-joueur")[2].classList.contains("tuto-en-pause")), "Tom en pause");
  await ok(p);
  assert.equal(await titre(p), "La dernière carte");
  assert.equal(await p.locator("#tutoriel .tuto-plateau .Carte:not(.retournee):not(.tuto-partie)").count(), 1, "une seule carte cachée reste");
  await ok(p);
  assert.equal(await titre(p), "À toi de jouer !");
  assert.ok(await p.evaluate(() => document.querySelector("#tutoriel .tuto-passer").hidden), "pas de « Passer » à la fin");
  await ok(p);
  await p.waitForTimeout(800);
  assert.ok(!(await ouvert(p)), "fermé à la fin");
  assert.ok(await p.evaluate(() => !!document.getElementById("aideAccueil")), "puis les flèches vers les Règles et les Réglages");
  assert.equal(await p.evaluate(() => localStorage.getItem("alcuno_tutoriel")), "vu");
  await p.reload(); await p.waitForTimeout(1500);
  assert.ok(!(await ouvert(p)), "une seule fois");
  assert.deepEqual(erreurs, [], "aucune erreur dans la page");
  await p.close();

  // ----- « Passer » au milieu : plus rien ne s'ouvre ensuite (ni flèches)
  const s = await ouvrir(b, { alcuno_tutoriel: "a_voir" });
  await ok(s.p);
  await s.p.click("#tutoriel .tuto-passer");
  await s.p.waitForTimeout(1200);
  assert.ok(!(await ouvert(s.p)) && await s.p.evaluate(() => !document.getElementById("aideAccueil")), "Passer : tout se ferme");
  assert.equal(await s.p.evaluate(() => localStorage.getItem("alcuno_tutoriel")), "vu");
  await s.p.close();

  // ----- « Passer le tutoriel » dès l'accueil, et bouton retour du téléphone
  const t = await ouvrir(b, { alcuno_tutoriel: "a_voir" });
  await t.p.click("#tutoriel .voletPause-annuler");
  await t.p.waitForTimeout(500);
  assert.ok(!(await ouvert(t.p)), "Passer le tutoriel");
  await t.p.evaluate(() => afficherTutoriel(true));
  await t.p.evaluate(() => actionRetour()());
  await t.p.waitForTimeout(500);
  assert.ok(!(await ouvert(t.p)), "le bouton retour ferme le tutoriel");
  // Règles : « 🎓 Tutoriel » le rejoue, et on revient aux Règles
  await t.p.evaluate(() => document.getElementById("btnRegles").click());
  await t.p.waitForTimeout(600);
  await t.p.click("#btnTutoDepuisRegles");
  assert.ok(await ouvert(t.p), "rejoué depuis les Règles");
  await t.p.click("#tutoriel .voletPause-annuler");
  await t.p.waitForTimeout(500);
  assert.ok(await t.p.evaluate(() => document.getElementById("ecranRegles").style.display !== "none" && !document.getElementById("aideAccueil")), "retour aux Règles, sans les flèches");
  assert.deepEqual(t.erreurs, [], "aucune erreur (passer, retour, Règles)");
  await t.p.close();

  // ----- ancien joueur (il a déjà des réglages) : jamais tout seul
  const a = await ouvrir(b, { alcuno_premiere_partie_jouee: "1" });
  await a.p.waitForTimeout(800);
  assert.ok(!(await ouvert(a.p)), "pas pour un ancien joueur");
  await a.p.close();

  // ----- vrai nouveau joueur (téléphone vierge, pas un robot de test) : il s'ouvre tout seul
  const n = await b.newPage({ viewport: { width: 1000, height: 780 } });
  await n.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await n.goto(URL); await n.waitForTimeout(1500);
  assert.ok(await ouvert(n), "nouveau joueur détecté tout seul");
  await n.close();

  // ----- iPhone dans le navigateur : l'écran « Installer Alcuno » d'abord, le tutoriel quand on le ferme
  const ctx = await b.newContext({ ...require("playwright").devices["iPhone 13"] });
  const i = await ctx.newPage();
  await i.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await i.goto(URL); await i.waitForTimeout(1500);
  assert.ok(!(await ouvert(i)) && await i.evaluate(() => document.getElementById("ecranInstallation").style.display !== "none"), "l'écran d'installation passe avant");
  await i.evaluate(() => document.getElementById("btnInstallationPlusTard").click());
  await i.waitForTimeout(1200);
  assert.ok(await ouvert(i), "puis le tutoriel");
  await ctx.close();

  console.log("Tutoriel : ouverture pour les nouveaux, mini-partie jusqu'au bout, Passer, retour, rejoué depuis les Règles.");
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
