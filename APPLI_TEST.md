# Alcuno TEST : copie de test du jeu

Ce dépôt (Tristan-Escardo/Alcuno-test) est une **copie de test** du vrai jeu (Tristan-Escardo/Alcuno).
Il sert à essayer des nouveautés (thèmes de fêtes, voir FETES.md) sur un téléphone sans toucher au vrai jeu.

Tout est séparé du vrai jeu :

| | Vrai jeu | Appli TEST |
|---|---|---|
| Dépôt | Tristan-Escardo/Alcuno | Tristan-Escardo/Alcuno-test |
| Adresse | tristan-escardo.github.io/Alcuno | voir ADRESSE ci-dessous (Netlify) |
| Firebase | projet `alcuno` | projet de test (voir `firebaseConfig` dans index.html) |
| Cache hors connexion (sw.js) | `alcuno-vNN` | `alcuno-test-vNN` |
| Nom sur le téléphone | Alcuno | Alcuno TEST (icône avec bandeau TEST) |

Pourquoi pas GitHub Pages : une copie sur tristan-escardo.github.io partagerait avec le vrai jeu la mémoire
du téléphone (localStorage) et le cache hors connexion. sw.js efface au démarrage tous les caches qui
ne portent pas son nom : les deux applis effaceraient le cache l'une de l'autre.

## Ce qui diffère du vrai jeu

- Config Firebase (index.html et stats.html) : projet de test.
- Adresses du jeu (liens d'invitation, QR codes, partage, télé) : calculées à partir de l'adresse de la
  page (`new URL("./", location.href)`) au lieu d'être écrites en dur.
- `icones/qr_alcuno.svg` et icônes : refaits pour l'appli TEST.
- MODE_TEST (script.js) est vrai sur Netlify : pas de statistiques ni de rapports de plantage, et la
  version affiche « · TEST ».
- `.github/workflows/nettoyage.yml` : pointe vers la base de TEST (ne doit jamais recevoir le secret du vrai jeu).
- Tests en ligne (tests/*.ps1) : pointent vers la base de TEST.

## Reporter une nouveauté vers le vrai jeu

Ne pas fusionner ce dépôt dans Alcuno (on y emporterait la config de test). Recopier seulement les
fichiers du thème validé (CSS, images, sons, code du thème).
