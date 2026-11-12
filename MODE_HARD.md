# Mode hard : décisions

Statut : codé dans l'appli test (jeu 9.90.0, cache `alcuno-test-v95`). Dernière mise à jour : 12 novembre.

## Règles
- Une option de plus dans « Ta partie », comme les autres modes. Se cumule avec Mode PJ et Partie express,
  **jamais avec le mode hot** (cocher l'un décoche l'autre).
- **À 2 joueurs seulement** : sinon « Jouer » (ou le lancement en ligne) affiche « Le mode hard se joue à 2 joueurs seulement. »
- Même fonctionnement que le mode hot (`partieHot` est vrai aussi en hard) : plus de cartes « 1 », un défi quand on doit boire,
  « Je le fais » / « Je bois N ». Refuser = boire les gorgées prévues.
- Paquet : celui du hot à 2 joueurs, donc **sans Cupidon** ; carte **Coup de foudre** à la Saint-Valentin :
  « un doigt dans le cul… ou un CUL SEC » (4 gorgées en mode PJ).
- Défis (`DEFIS_HOT.HA` / `DEFIS_HOT.HB` dans `js/mode-hot.js`, 20 en HA et 19 en HB, validés par l'utilisateur ; HB20 retiré, pas remplacé) :
  - **HA** (embrasser, préliminaires) : jusqu'à 4 gorgées (jusqu'à 2 en mode PJ)
  - **HB** (actes sexuels) : 5 gorgées et plus (3 et plus en mode PJ)
  - Le défi vise toujours l'autre joueur ({nom}). Les défis à {nom1} / {nom2} ne sortent pas (il faut 3 joueurs).
- Pas de « Couple de la soirée » dans le récap (2 joueurs : toujours le même couple).

## Affichage
- « Ta partie » : cadre noir, textes blancs, « hard » noir sur orange (idée 3), le même dans tous les thèmes
  (bordure orange en thème Sombre). Texte : « On est pas là pour se titiller la bite avec des gants de boxe. »
  + « Idée de Jojo mon clown préféré. »
- Bandeau : **18 barré dessiné** après ALCUNO (`SVG_18_BARRE`, js/plateau.js ; pas l'emoji 🔞 qui affiche
  « UNDER 18 » sur Android). Aussi sur la télé, dans le bloc du défi (« MODE HARD ») et la fenêtre Coup de foudre.
- Crédits : Jojo dans « Mention honorable » (idée du mode hard).

## Déblocage
- Caché tant qu'il n'est pas débloqué sur le téléphone : entrer **« Jojo »** comme nom de joueur (ou pseudo en ligne),
  majuscules et accents ignorés. Jojo reste un joueur normal. Clé `alcuno_hard_debloque`.
- En ligne : seul celui qui lance la partie a besoin de l'avoir débloqué (bit 2^36 de la graine, `graineHard`).
- Lancer une partie hard débloque aussi le thème Donjon (BDSM), comme le hot.

## Zizi-coptère (`js/zizi-coptere.js`)
- Débloqué en **finissant une partie hard** (récap de fin), hôte ou pas, avec ou sans PJ / express. Clé `alcuno_zizi_coptere`.
- Notif « 🚁 Zizi-coptère débloqué ! Sur l'accueil, thème BDSM » sur le récap, une seule fois par téléphone.
- Seulement avec le **thème Donjon**, à côté du titre de l'accueil.
- Toucher : il tourne quelques tours. Doigt maintenu : on le déplace partout, et il tourne pendant ce temps.

## Pilotage et stats (stats.html)
- Compteur `modes/hard` ; niveaux de défis ajoutés « HA » / « HB » ; défis du jeu HA1… masquables.
- **Règles Firebase modifiées** (`database.rules.json`) : à copier dans la console Firebase et à publier.
