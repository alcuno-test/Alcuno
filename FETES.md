# Thèmes de fêtes : dates (à NOTER seulement)

Rien n'est automatique pour l'instant : chaque thème est créé et testé un par un dans l'appli TEST.
Le calendrier automatique (le thème apparaît puis disparaît aux dates ci-dessous) ne sera codé
qu'une fois **tous** les thèmes validés.

Dates incluses, heure du téléphone. « du X au Y » = du X à 0 h au Y à 23 h 59, sauf mention contraire.

| Fête | Début | Fin | Remarques | État |
|---|---|---|---|---|
| Nouvel An | 1er janvier, 0 h | 2 janvier, 0 h (exclu) | 24 h pile. Pas un thème : des feux d'artifice sur tous les écrans, dans tous les thèmes (style_feux.css ; pour l'instant case « Feux d'artifice » dans les Réglages) | fait |
| Chandeleur | 28 janvier | 3 février | Poêle de cuivre et crêpe qui saute (style_chandeleur.css, chandeleur/) ; pas de musique ni de son pour l'instant | fait |
| Saint-Valentin | 7 février | 15 février | + un truc spécial sur le mode hot | à faire |
| Saint-Patrick | 14 mars | 18 mars | | à faire |
| 1er avril | 1er avril | 1er avril | pas un thème : une blague / un piège dans le jeu (à inventer) | à faire |
| Just Rosé | 4 mai | 12 mai | | à faire |
| Fête de la musique | 18 juin | 22 juin | | à faire |
| Fête nationale | 13 juillet | 15 juillet | | à faire |
| Halloween | 20 octobre | 1er novembre | | à faire |
| Noël | 18 décembre | 26 décembre | | fait |

Aucune période ne se chevauche (vérifié à la main sur ce tableau).

## Tester un thème (avant de le valider)

Jeu servi en local (`python -m http.server 8765` depuis le dossier du jeu), puis :

- `node tests/test_affichage_telephone.js <thème>` (environ 3 min)
- `node tests/test_affichage_tele.js <thème>` (environ 2 min)

Ils vérifient tout l'affichage du téléphone et de la télé dans ce thème et font une planche de captures
dans `tests/resultats/`.
