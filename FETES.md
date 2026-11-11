# Thèmes de fêtes : dates (à NOTER seulement)

Rien n'est automatique pour l'instant : chaque thème est créé et testé un par un dans l'appli TEST.
Le calendrier automatique (le thème apparaît puis disparaît aux dates ci-dessous) ne sera codé
qu'une fois **tous** les thèmes validés.

Dates incluses, heure du téléphone. « du X au Y » = du X à 0 h au Y à 23 h 59, sauf mention contraire.

| Fête | Début | Fin | Remarques | État |
|---|---|---|---|---|
| Nouvel An | 1er janvier, 0 h | 2 janvier, 0 h (exclu) | 24 h pile. Pas un thème : des feux d'artifice sur tous les écrans, dans tous les thèmes, plus un chapeau de fête sur le O du titre de l'accueil (style_feux.css ; pour l'instant case « Feux d'artifice » dans les Réglages). Pour la voir : `?fete=nouvel-an`, ou simplement le réglage coché | fait |
| Chandeleur | 28 janvier | 3 février | Poêle de cuivre et crêpe qui saute (style_chandeleur.css, chandeleur/) ; pas de musique ni de son pour l'instant | fait |
| Saint-Valentin | 7 février | 15 février | Cœur et flèche à la place du O du titre, cœurs rouges qui flottent sur l'accueil (style_valentin.css, valentin/). musique (boucle de 1 min 38) ; mode hot : carte « Coup de foudre » (voir MODE_HOT.md) | à valider |
| Saint-Patrick | 14 mars | 18 mars | Tout en vert : chapeau de lutin sur le O du titre, deux pintes en bas de l’accueil, trèfles / chapeaux / pintes en motif, joueur actif vert brillant (style_patrick.css, patrick/) ; musique (boucle de 1 min 04,9 : le morceau entier, fondu de fin retiré et résonance repliée sur le début) | à valider |
| 1er avril | 1er avril | 1er avril | pas un thème : 3 blagues en réserve (js/poisson.js, style_poisson.css), une seule tirée au hasard par appareil le 1er avril ; voir « Poisson d'avril » plus bas | à valider |
| Just Rosé | 4 mai | 12 mai | La fête du rosé de Sanary (affiche 2026 : « du 8 au 10 mai », à confirmer pour les dates). Fond magenta #cc3381, tout en blanc, boutons rose foncé, « Just » au-dessus du titre, verre de rosé entre deux parapluies et feux d'artifice sur l'accueil, motif de verres de rosé sur tous les écrans sauf l'accueil (style_justrose.css, justrose/) ; dos des cartes en rose (Cartes/dos_justrose.png) ; musique (boucle de 1 min 50,2 = 56 mesures, de 29,6 s à 2 min 19,8 du morceau ; la dernière mesure fond vers ce qui précédait le départ) | à valider |
| Fête de la musique | 18 juin | 22 juin | Fond violet électrique, panneaux indigo, boutons violet foncé, notes de musique néon en fond, deux faisceaux de projecteur et un égaliseur sur l'accueil, un piano jouable à la place de la ligne sous le titre : de Fa 4 à Sol 5 (15 touches), un tap sur une touche joue sa note (style_musique.css, musique/, js/piano-accueil.js, Sons/piano/) ; 8 sons de saxophone au clic des boutons (Sons/saxo/, un au hasard, comme les sabres en Star Wars) ; musique (boucle de 36,96 s = 20 mesures : le morceau se répète de lui-même, la reprise n'est pas un raccord) | à valider |
| Fête nationale | 13 juillet | 15 juillet | Pas un thème, comme le Nouvel An : exactement les mêmes feux d'artifice sur tous les écrans et dans tous les thèmes (style_feux.css), mais **sans** le chapeau de fête sur le titre. La couronne du thème Prestige reste donc visible. Plus tard elle réutilisera la case « Feux d'artifice » du Nouvel An, les deux ne tombant jamais ensemble ; en attendant, case de test « Fête nationale 🇫🇷 » dans les Réglages (à retirer quand le calendrier sera codé), ou `?fete=nationale` dans l'adresse | à valider |
| Halloween | 20 octobre | 1er novembre | | à faire |
| Noël | 18 décembre | 26 décembre | | fait |

Aucune période ne se chevauche (vérifié à la main sur ce tableau).

## Annonce d'un thème de fête

Au premier lancement du jeu pendant la période d'une fête (Noël, Chandeleur, Saint-Valentin, Saint-Patrick, Just Rosé, Fête de la musique pour l'instant), une fenêtre du
même style que les « thème débloqué » annonce « Nouveau thème X disponible pour une durée limitée !! », aux couleurs de CETTE fête
(style_annonce_fete.css, `FETES_ANNONCE` dans js/reglages.js). Une seule fois par période et par appareil. Boutons : Noël « Joyeux Noël »,
Saint-Patrick « Sláinte is táinte ! », les autres « L'essayer maintenant » ; et « Plus tard » partout. Pour la voir hors période : ouvrir
le jeu avec `?annonce_fete=patrick` (ou noel, chandeleur, valentin). Chaque nouvelle fête : l'ajouter dans `FETES_ANNONCE` et
style_annonce_fete.css.

## Poisson d'avril

Trois blagues, une seule tombe le 1er avril (tirage gardé par appareil et par année) :
1. le titre de l'accueil devient « UNO » et tout texte « Alcuno » du jeu devient « Uno » (adresses laissées telles quelles) ; les dos de cartes « ALC UNO » (défaut, Star Wars, Kawaii) passent aussi en « UNO » (images Cartes/dos_uno.svg, dos_*_uno.svg ; règles CSS générées par `python3 outils/poisson_dos.py` dans style_poisson.css) ; un tap dessus ouvre « POISSON D’AVRIL !! C’est toujours un jeu d’alcool 😊 » avec le bouton « Trop drôle » ;
2. fausse mise à jour « tout le monde boit triple » : le bouton OK s'enfuit (7 tentatives, ou 20 s par sécurité), puis avoue « Poisson d’avril ! » ;
3. faux plantage : le bouton « Réparer » s'enfuit (7 tentatives, ou 20 s par sécurité), puis avoue « Poisson d’avril ! ».
Les 2 et 3 attendent l'accueil (jamais en pleine partie), ne s'affichent qu'une fois et n'envoient rien à l'onglet Santé.
Pour les voir hors du 1er avril : ouvrir le jeu avec `?poisson=1`, `?poisson=2` ou `?poisson=3`.

## Tester un thème (avant de le valider)

Jeu servi en local (`python -m http.server 8765` depuis le dossier du jeu), puis :

- `node tests/test_affichage_telephone.js <thème>` (environ 3 min)
- `node tests/test_affichage_tele.js <thème>` (environ 2 min)

Ils vérifient tout l'affichage du téléphone et de la télé dans ce thème et font une planche de captures
dans `tests/resultats/`.
