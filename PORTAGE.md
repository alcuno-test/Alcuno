# Porter l'appli TEST vers le vrai Alcuno

Ce document liste ce qui a été fait dans l'appli **TEST** (dépôt `alcuno-test/Alcuno`,
en ligne sur `alcuno-test.github.io/Alcuno`) et qui n'est **pas encore** dans le vrai jeu
(dépôt `Tristan-Escardo/Alcuno`).

D'après l'historique noté dans `sw.js`, le vrai jeu en est au cache **`alcuno-v22`**
(sons des boutons BDSM) et le test au cache **`alcuno-test-v92`**. Tout ce qui suit a donc
été ajouté côté test et n'existe pas dans le vrai jeu. **À vérifier quand même** : je n'ai
pas accès au vrai dépôt, cette affirmation repose sur le commentaire d'historique de `sw.js`.

## Méthode conseillée

Ne pas rejouer les 90 versions une par une. Comparer les deux dépôts fichier par fichier
et reprendre les fichiers du test, **sauf ceux listés dans « À NE PAS copier »** plus bas.

---

## Ce qu'il y a à porter

### 1. Thèmes de fête (9 au total)

Chacun = un fichier `style_<thème>.css` + un dossier d'images, plus son enregistrement dans
`index.html` (chargement du CSS, pastille des Réglages, couleur de la barre du téléphone),
`js/config-lib.js` (`THEMES_CONNUS`, `NOMS_THEMES`, synonyme pour l'assistant) et
`js/reglages.js` (`THEMES`, `THEMES_DE_FETE`, `FETES_ANNONCE`).

| Thème | Fichiers | Remarques |
|---|---|---|
| Noël | `style_noel.css`, `noel/` | musique + grelots du traîneau |
| Chandeleur | `style_chandeleur.css`, `chandeleur/` | poêle et crêpe qui saute |
| Saint-Valentin | `style_valentin.css`, `valentin/` | cœur à la place du O ; carte « Coup de foudre » en mode hot |
| Saint-Patrick | `style_patrick.css`, `patrick/` | chapeau de lutin sur le O, pintes |
| Just Rosé | `style_justrose.css`, `justrose/` | dos de cartes rose (`Cartes/dos_justrose.png`) |
| Fête de la musique | `style_musique.css`, `musique/` | piano JOUABLE sur l'accueil (voir §3) |
| Halloween | `style_halloween.css`, `halloween/` | dos de cartes ensanglanté (`Cartes/dos_halloween.png`) |
| Nouvel An | `style_feux.css` | pas un thème : feux d'artifice + chapeau de fête |
| Fête nationale | (dans `style_feux.css`) | les mêmes feux, sans le chapeau |

Les dates de chaque fête sont dans **`FETES.md`**. Elles ont été validées : **ne pas les changer**.

### 2. Mécanismes partagés

- **Annonce d'un thème de fête** : `style_annonce_fete.css` + `FETES_ANNONCE` et
  `feteEnCours()` dans `js/reglages.js`. Une fenêtre par période et par appareil.
  Les fêtes qui ne sont pas des thèmes (Nouvel An, Fête nationale, 1er avril) n'en ont pas.
- **Nouvel An et Fête nationale automatiques** : le script du `<head>` de `index.html` pose
  `html[data-fete="nouvel-an"|"nationale"]` selon la date du téléphone (1er janvier ;
  13 au 15 juillet). Le réglage « Feux d'artifice » n'apparaît que pendant ces périodes.
  `?fete=nouvel-an` et `?fete=nationale` forcent l'affichage hors période.
- **Poisson d'avril** : `js/poisson.js` + `style_poisson.css` + les dos de cartes « UNO »
  (`Cartes/dos_uno.svg`, `dos_galaxie_*_uno.svg`, `dos_kawaii_uno_*.svg`, générés par
  `outils/poisson_dos.py`). Trois blagues, une tirée au hasard par appareil le 1er avril.
  `?poisson=1|2|3` pour les voir hors période.
- **Écran « Installer Alcuno »** : il garde le look de base (bordeaux) dans TOUS les thèmes.
  Voir le bloc commenté dans `style_alcuno.css` : les sélecteurs y sont longs à dessein
  (les thèmes habillent tous les boutons d'un coup avec une liste `:is(...)` contenant
  `#menu #btnCaster`, donc deux identifiants ; il en faut trois pour passer devant, d'où
  l'id `installationContenu` ajouté dans `index.html`). Star Wars et BDSM excluent en plus
  les deux boutons de cet écran de leur règle générale.

### 3. Piano jouable de l'accueil (thème Fête de la musique)

`js/piano-accueil.js` + `Sons/piano/piano_*.mp3` (15 notes, Fa 4 à Sol 5).
La barre colorée sous le titre devient un clavier : un tap joue la note, un glissé du doigt
les enchaîne. Appelé par `appliquerTheme()` et au chargement du fichier lui-même
(il est chargé APRÈS `js/reglages.js`, donc `appliquerTheme` ne peut pas le faire au démarrage).
À ajouter à `FICHIERS_JEU` dans `index.html` et à `A_PRECHARGER` dans `sw.js`.

### 4. Sons et musiques

| Fichier | Quoi |
|---|---|
| `Sons/musique_ambiance_patrick.mp3` | Saint-Patrick, boucle de 40 mesures |
| `Sons/musique_ambiance_justrose.mp3` | Just Rosé, boucle de 56 mesures |
| `Sons/musique_ambiance_musique.mp3` | Fête de la musique, boucle de 20 mesures |
| `Sons/musique_ambiance_valentin.mp3` | Saint-Valentin, **remplacé** par une boucle de 58 mesures |
| `Sons/saxo/*.mp3` (8) | sons des boutons du thème Fête de la musique |
| `Sons/piano/*.mp3` (15) | notes du piano de l'accueil |

Chaque musique est une **boucle exacte** : le fichier contient
`[0,3 s de fin de boucle] + [boucle] + [0,3 s de début de boucle]`, et sa longueur exacte
en échantillons est déclarée dans `BOUCLES_EXACTES` (`js/reglages.js`). Ne pas ré-encoder
ces fichiers : la longueur ne correspondrait plus.

Les sons de boutons par thème sont dans `SONS_CLIC_THEME` (`js/reglages.js`) :
`galaxie` → sabres, `donjon` → BDSM, `musique` → saxo.

### 5. Outils

- `outils/teinter_or_theme.py <thème>` : recolore tout le doré du jeu de base aux couleurs
  d'un thème et écrit un bloc généré en haut de `style_<thème>.css`. Table `THEMES` + `TEINTE`
  à compléter pour chaque nouveau thème. **Ne pas modifier le bloc généré à la main.**
- `outils/poisson_dos.py` : génère les règles CSS des dos de cartes « UNO » du 1er avril.

### 6. Tests

- `tests/affichage_commun.js` : nouveau contrôle **DOS OUBLIÉ** (un thème change le dos de
  certaines cartes mais en oublie une — c'était arrivé à la carte dorée).
- `tests/test_affichage_telephone.js` : écrans ajoutés (annonces de fête, poisson d'avril,
  cartes dorées). Les écrans du poisson d'avril sont **sautés dans les thèmes de fête** :
  aucune période de `FETES.md` n'inclut le 1er avril.
- `tests/test_themes.js` : les nouveaux thèmes dans la liste.

---

### 7. Mode hard (test 9.90.0, cache `alcuno-test-v95`)

Voir **`MODE_HARD.md`**. Fichiers touchés : `index.html` (ligne « Mode hard » de « Ta partie », badge 18 barré du
bandeau, Jojo dans les crédits, `js/zizi-coptere.js` dans `FICHIERS_JEU`), `js/mode-hot.js` (défis HA / HB),
`js/reglages.js`, `js/regles.js`, `js/plateau.js`, `js/en-ligne.js`, `js/synchro-en-ligne.js`, `js/tele.js`,
`js/stats.js`, `js/config-lib.js`, nouveau `js/zizi-coptere.js`, `style_alcuno.css`, `stats.html`,
`database.rules.json` (**à republier dans la console Firebase du vrai jeu aussi**), `sw.js`, `tests/`.

## À NE PAS copier (propre à l'appli test)

0. **`js/zizi-coptere.js`, `ZIZI_TEST_DEBLOQUE = true`.** Dans le test, le zizi-coptère est débloqué de base
   pour l'essayer. Dans le vrai jeu : mettre `false` (il se débloque en finissant une partie hard).

1. **`sw.js`, nom du cache.** Le test utilise `alcuno-test-vXX`. Le vrai jeu utilise
   `alcuno-vXX` : repartir de SON numéro (v22 d'après l'historique) et l'incrémenter.
   Ne pas copier le commentaire d'historique du test, qui fait plusieurs milliers de caractères.
2. **`index.html`, configuration Firebase.** Le test pointe sur le projet `alcuno-test`
   (`authDomain`, `databaseURL`, `projectId`, `storageBucket`). Garder celle du vrai jeu.
3. **`index.html`, adresses.** `og:url`, `og:image`, le texte `.lienJeu`
   (« alcuno-test.github.io/Alcuno ») et `.adresseTele` : garder celles du vrai jeu.
4. **`script.js`, `MODE_TEST`.** La ligne contient une condition sur `alcuno-test.github.io`
   et ajoute un suffixe à la version affichée. Garder celle du vrai jeu.
5. **`VERSION_AFFICHEE`.** Le test en est à 9.89.12 ; mettre le numéro suivant du vrai jeu.
6. **`tests/empreinte_cache.json`.** Fichier généré : lancer
   `node outils/maj_empreinte_cache.js` après avoir changé le nom du cache.
7. **`APPLI_TEST.md`** et ce fichier (`PORTAGE.md`) : ils ne concernent que le test.

---

## Dans quel ordre, et comment vérifier

1. Copier les fichiers **nouveaux** (CSS de thèmes, dossiers d'images, `js/poisson.js`,
   `js/piano-accueil.js`, sons, musiques, dos de cartes, outils).
2. Reporter les **modifications** de `index.html`, `js/reglages.js`, `js/config-lib.js`,
   `style_alcuno.css`, `style_feux.css`, `style_donjon.css`, `stats.html`, `FETES.md`,
   `Sons/README.txt` — en respectant la liste « À NE PAS copier ».
3. Ajouter tous les nouveaux fichiers à `A_PRECHARGER` / `SONS_A_PRECHARGER` dans `sw.js`,
   et les scripts à `FICHIERS_JEU` dans `index.html`.
4. Changer le nom du cache, puis `node outils/maj_empreinte_cache.js`.
5. Lancer les tests, depuis un serveur local (`python3 -m http.server 8765`) :

   ```
   node tests/test_cache.js
   node tests/test_config.js
   node tests/test_themes.js --sans-partie
   node tests/test_affichage_telephone.js <thème>
   node tests/test_affichage_tele.js <thème>
   ```

   Au moment où ce document est écrit, dans le test : **tout est vert** pour les 7 thèmes de
   fête (67 écrans en téléphone, 31 en télé pour Halloween), cache et config compris.

6. Regarder les planches de captures produites dans `tests/resultats/` : les tests ne voient
   pas les couleurs comme un œil. Deux angles morts connus, utiles à garder en tête :
   - le calcul de contraste lit la **couleur de fond déclarée** d'un élément, pas l'image
     opaque posée par-dessus. Un thème qui met une couleur claire dans `--couleur-barre`
     (qui sert de fond de secours aux écrans) fait chuter tous les contrastes mesurés, alors
     que rien n'a changé à l'écran ;
   - il ne voit pas non plus un texte dessiné en **contour** (`-webkit-text-stroke`) : le
     titre ALCUNO de Star Wars est signalé à 1,15 de contraste alors qu'il est parfaitement
     lisible.

## Ce qui n'est pas fait

- **Le calendrier automatique des thèmes de fête.** Pour l'instant chaque thème se choisit à
  la main dans les Réglages. Seules les fêtes qui ne sont pas des thèmes (Nouvel An, Fête
  nationale, 1er avril) se déclenchent déjà toutes seules à la bonne date. Voir `FETES.md`.
- **Halloween n'a ni musique ni sons de boutons.**
- Deux défauts de contraste **antérieurs** à ce travail, laissés tels quels à la demande :
  le bouton « Album de stickers » en Kawaii (texte blanc sur rose clair) et cinq textes du
  thème Star Wars (dont la plupart sont des angles morts du test, voir plus haut).
