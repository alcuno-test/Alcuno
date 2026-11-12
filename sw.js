// Service worker d'Alcuno : rend le jeu installable et jouable hors connexion (mode classique).
//
// Stratégie « réseau d'abord » : avec internet, on prend TOUJOURS la dernière version en ligne
// (et on met à jour la copie locale) ; la copie locale ne sert que quand il n'y a pas de réseau.
// Ainsi l'appli installée ne reste jamais bloquée sur une vieille version (sinon les téléphones
// d'une partie en ligne n'auraient pas la même version).
//
// Changer CACHE (ex. "alcuno-v2") force les téléphones à repartir d'une copie locale propre.

const CACHE = "alcuno-test-v124"; // APPLI TEST (dépôt Alcuno-test) : nom propre au test. Test v124 : crédits, mentions honorables côte à côte comme les créateurs, version 9.90.29 ; Test v123 : couronne argentée pour Jojo (comme Li-Mèi), version 9.90.28 ; Test v122 : « tapote-moi » plus discret, collé au zizi, petit rebond doux, version 9.90.27 ; Test v121 : « tapote-moi » qui sautille, version 9.90.26 ; Test v120 : « tapote-moi » rose clair lumineux, plus haut, version 9.90.25 ; Test v119 : « tapote-moi… » plus discret (petit, rouge transparent), version 9.90.24 ; Test v118 : « tapote-moi… » discret, sans cadre, en italique, version 9.90.23 ; Test v117 : bulle « Tapote-moi » au-dessus du zizi-coptère tant que le son est bloqué, version 9.90.22 ; Test v116 : diagnostic du son retiré (limite d'iOS : un appui long ne débloque pas le son), version 9.90.21 ; Test v115 : zizi-coptère, appui long reconnu comme un geste sur iPhone (touchstart empêché), version 9.90.20 ; Test v114 : diagnostic provisoire du son du zizi-coptère sur l'accueil BDSM (appli test), version 9.90.19 ; Test v113 : bruit du zizi-coptère au premier toucher (2e essai), version 9.90.18 ; Test v112 : bruit du zizi-coptère dès le premier toucher (relancé au doigt relevé), version 9.90.17 ; Test v111 : bruit du zizi-coptère sur 2 s après le lâcher, son chargé dès l'affichage, version 9.90.16 ; Test v110 : interrupteur du mode hard noir / orange dans tous les thèmes, version 9.90.15 ; Test v109 : bruit du zizi-coptère coupé en 0,8 s quand on le lâche, version 9.90.14 ; Test v108 : son à l'activation du mode hard (Sons/mode_hard.mp3), version 9.90.13 ; Test v107 : son du zizi-coptère (Sons/zizicoptere.mp3, en boucle quand il tourne), version 9.90.12 ; Test v106 : thème BDSM, chaîne sous le titre à la place de la barre arc-en-ciel (donjon/chaine_h.svg), version 9.90.11 ; Test v105 : zizi-coptère redessiné (style BDSM, anneau clouté, halo rouge), centré sur le A ; 4 objets qui tombent au lieu de 8 dans le thème BDSM, version 9.90.10 ; Test v104 : zizi-coptère devant le A d'ALCUNO, version 9.90.9 ; Test v103 : zizi-coptère posé sur le A d'ALCUNO, version 9.90.8 ; Test v102 : zizi-coptère posé sur le O d'ALCUNO, pointe vers le bas, version 9.90.7 ; Test v101 : le zizi-coptère tourne vraiment (animation d'entrée de l'accueil qui bloquait sa rotation), version 9.90.6 ; Test v100 : fenêtres « Mode hard débloqué » et « Zizi-coptère débloqué », contour orange néon du mode hard, sans la ligne Jojo, version 9.90.5 ; Test v99 : zizi-coptère lançable (gravité, rebonds, rotation qui ralentit), plus gros, chaînes du thème BDSM retirées, version 9.90.4 ; Test v98 : notif « Zizi-coptère débloqué » à la fin d'une partie hard, version 9.90.3 ; Test v97 : mode hard, défi HB20 retiré, version 9.90.2 ; Test v96 : zizi-coptère débloqué de base (test seulement), version 9.90.1 ; Test v95 : mode hard (défis HA / HB, 2 joueurs, débloqué par « Jojo »), zizi-coptère du thème Donjon, version 9.90.0 ; Test v94 : Halloween, icônes Règles et Réglages en rouge, version 9.89.14 ; Test v93 : correction d'un </div> en trop dans les Réglages (la vue « Ta partie » affichait aussi les réglages), version 9.89.13 ; Test v92 : nouvelle musique du thème Saint-Valentin (boucle de 58 mesures), version 9.89.12 ; Test v91 : thèmes de fête, les lignes de réglage isolées prennent le ton du thème comme les autres blocs, version 9.89.11 ; Test v90 : Halloween, haut de l'écran noir avec un fondu vers le décor, barre du téléphone identique, version 9.89.10 ; Test v89 : Halloween, lueur rouge en haut de l'écran et barre du téléphone à sa couleur (le haut n'est plus noir), version 9.89.9 ; Test v88 : Halloween, taches de sang à la place des coulures et haut de l'écran à la couleur du fond, version 9.89.8 ; Test v87 : Halloween, coulures du haut en rouge vif et barre du téléphone à leur couleur exacte, version 9.89.7 ; Test v86 : Halloween, bande du haut à la couleur du sang qui coule, version 9.89.6 ; Test v85 : Halloween, le sang des citrouilles et des éclaboussures n'est plus coupé (cadres des dessins agrandis), version 9.89.5 ; Test v84 : Halloween, bande de sang unie tout en haut des écrans, que la barre du téléphone prolonge exactement ; thème « Musique » dans les Réglages, version 9.89.4 ; Test v83 : Halloween, barre du téléphone rouge sang, version 9.89.3 ; Test v82 : Halloween, exception du poisson d'avril retirée (il ne tombe jamais pendant une fête), version 9.89.2 ; Test v81 : Halloween, tout le texte en rouge sang et noms des thèmes en orange, version 9.89.1 ; Test v80 : thème de fête Halloween (style_halloween.css, halloween/, dos de cartes ensanglanté), version 9.89.0 ; Test v78 : Nouvel An et Fête nationale déclenchés à leur date, réglage « Feux d'artifice » visible seulement pendant la fête, version 9.88.13 ; Test v77 : Fête nationale (les feux du Nouvel An sans le chapeau de fête), version 9.88.12 ; Test v76 : musique du thème Just Rosé (boucle de 56 mesures), version 9.88.11 ; Test v75 : piano de l'accueil étendu à Sol 5 (15 touches), version 9.88.10 ; Test v74 : écran « Installer Alcuno » au look de base (bordeaux) dans tous les thèmes, version 9.88.9 ; Test v73 : petit piano jouable sous le titre de l'accueil (Sons/piano/, js/piano-accueil.js), version 9.88.8 ; Test v72 : musique du thème Fête de la musique (boucle de 20 mesures), version 9.88.7 ; Test v71 : 30 sons de saxophone retirés (8 gardés), version 9.88.6 ; Test v70 : sons de saxophone aux boutons du thème Fête de la musique (Sons/saxo/), version 9.88.5 ; Test v69 : musique du thème Saint-Patrick (boucle de 40 mesures), version 9.88.4 ; Test v68 : Fête de la musique, boutons violet foncé, version 9.88.3 ; Test v67 : Fête de la musique, boutons sans contour blanc, version 9.88.2 ; Test v66 : Fête de la musique, boutons vert fluo, version 9.88.1 ; Test v65 : thème Fête de la musique (style_musique.css, musique/), version 9.88.0 ; Test v64 : Just Rosé, verres de rosé partout (sauf accueil), fond uni pour « Signaler un bug », version 9.87.5 ; Test v63 : poisson d'avril, dos de la carte dorée en « UNO » aussi ; test d'affichage : cartes dorées + contrôle « dos oublié », version 9.87.4 ; Test v62 : Just Rosé, dos de la carte dorée en rose, version 9.87.3 ; Test v61 : Just Rosé, dos des cartes en rose (Cartes/dos_justrose.png), version 9.87.2 ; Test v60 : Just Rosé, motif de verres seulement sur le plateau, feux d'artifice et parapluies dans les menus, version 9.87.1 ; Test v59 : thème Just Rosé (style_justrose.css, justrose/), version 9.87.0 ; Test v58 : blague 1 appliquée tout de suite au chargement (reste « Uno » après un changement de thème), version 9.86.17 ; Test v57 : bouton de test des blagues retiré des Réglages, version 9.86.16 ; Test v56 : poisson d'avril 1, dos de cartes « UNO » (défaut, Star Wars, Kawaii), version 9.86.15 ; Test v55 : poisson d'avril 1, 🐟 à côté du titre du message, version 9.86.14 ; Test v54 : poisson d'avril, 7 tentatives et « Alcuno » devient « Uno » partout, version 9.86.13 ; Test v53 : bouton « Tester la blague du 1er avril » dans les Réglages, version 9.86.12 ; Test v52 : poissons d'avril (js/poisson.js, style_poisson.css), version 9.86.11 ; Test v51 : annonce de fête, nom de la fête sur sa propre ligne, version 9.86.10 ; Test v50 : annonce des thèmes de fête (style_annonce_fete.css), version 9.86.9 ; Test v49 : Saint-Patrick, trèfle dans le rond de l'aperçu, version 9.86.8 ; Test v48 : Saint-Patrick, voile de pause vert, version 9.86.7 ; Test v47 : thème Saint-Patrick (style_patrick.css, patrick/), version 9.86.6 ; Test v46 : télé (Coup de foudre sur plusieurs lignes, feux effacés en thème de fête), version 9.86.5 ; Test v45 : cœur du titre Saint-Valentin calé sur la ligne de base (toutes polices), pastille Saint-Valentin au-dessus de Coup de foudre, version 9.86.4 ; Test v44 : mention Saint-Valentin au-dessus de Coup de foudre, cœur des Réglages sans cadre en Givre / Kawaii, version 9.86.3 ; Test v43 : carte Coup de foudre (deux cœurs), mention Saint-Valentin bien visible, découpe du O seulement en BDSM, version 9.86.2 ; Test v42 : Coup de foudre, 4 gorgées en mode PJ, titre aéré avec « défi hot spécial Saint-Valentin », version 9.86.1 ; Test v41 : mode hot, carte Coup de foudre (Saint-Valentin) et « Couple de la soirée », version 9.86.0 ; Test v40 : musique du thème Saint-Valentin, version 9.85.24 ; Test v39 : Saint-Valentin, nom de la bannière « Tour de » en blanc néon, plus aucun jaune, version 9.85.23 ; Test v38 : O du titre revenu en BDSM, version 9.85.22 ; Test v37 : Saint-Valentin, plus aucun doré (outils/teinter_or_theme.py), joueur actif blanc néon, version 9.85.21 ; Test v36 : Saint-Valentin, cœur à la hauteur des lettres à la place du O, aperçu en cœur, version 9.85.20 ; Test v35 : Saint-Valentin, tous les titres en blanc, version 9.85.19 ; Test v34 : Saint-Valentin, titres des écrans en blanc, version 9.85.18 ; Test v33 : Saint-Valentin, ⌂ blanc, cœur du titre à mi-distance du N, version 9.85.17 ; Test v32 : Saint-Valentin, titre et icônes Réglages / Règles en blanc, version 9.85.16 ; Test v31 : Saint-Valentin, cœur du titre éloigné du N, version 9.85.15 ; Test v30 : Saint-Valentin, O du titre masqué proprement derrière le cœur, version 9.85.14 ; Test v29 : Saint-Valentin, petits cœurs rouges qui flottent sur l'accueil, version 9.85.13 ; Test v28 : thème Saint-Valentin (style_valentin.css, valentin/), version 9.85.12 ; Test v27 : Chandeleur, poêle renommée (poele_sans_citron.svg) pour sortir de l'ancien cache, version 9.85.11 ; Test v26 : Chandeleur, icône Règles du plateau au ton de l'en-tête, version 9.85.10 ; Test v25 : Chandeleur, citron retiré de la poêle, version 9.85.9 ; Test v24 : Chandeleur, compteur de cartes de la télé en panneau, version 9.85.8 ; Test v23 : Chandeleur, aperçu des Réglages en simple rond de couleur, version 9.85.7 ; Test v22 : Chandeleur, la poêle bouge avec la crêpe, version 9.85.6 ; Test v21 : Chandeleur, pastilles de la télé et pari de fin plus lisibles, version 9.85.5 ; Test v20 : Chandeleur, fond orange plus brûlé (lisibilité), version 9.85.4 ; Test v19 : thème Chandeleur (style_chandeleur.css, chandeleur/), version 9.85.3 ; Test v18 : version 9.85.2 (feux d'artifice et chapeau de fête du Nouvel An) ; Test v17 : chapeau de fête, variante B moins enfoncée ; Test v16 : chapeau de fête plus à droite et de biais ; Test v15 : chapeau de fête posé sur le O du titre ; Test v14 : chapeau de fête plus gros et plus festif ; Test v13 : chapeau de fête sur le titre ; Test v12 : réglage des feux d'artifice caché dans les thèmes de fête ; Test v11 : pas de feux d'artifice dans les thèmes de fête ; Test v10 : feux d'artifice activés de base, sous les thèmes dans les Réglages ; Test v9 : feux d'artifice plus nombreux, plus grands, plus colorés ; Test v8 : feux d'artifice du Nouvel An (style_feux.css, case dans les Réglages) ; Test v7 : boucle de la musique de Noël refaite (fin sur le passage sans chant) ; test v6 : musique et grelots du thème Noël ; test v5 : motif de fond du thème Noël plus visible ; test v4 : motif de fond du thème Noël (noel/deco_fond.svg) ; test v3 : boule à neige du thème Noël (noel/boule_neige.svg) ; test v2 : thème Noël (style_noel.css, noel/). Historique du vrai jeu : alcuno-v22 ; // v22 : sons des boutons BDSM retouchés (le test du cache était en échec) ; v21 : sons des boutons du thème BDSM (Sons/bdsm_buttons/) ; v20 : musique du thème BDSM, son de l'étoile filante ; v19 : faces de cartes du thème BDSM (Cartes/donjon/) ; v18 : dos des cartes du thème Donjon (cœur masqué) ; v17 : thème Donjon (style_donjon.css, donjon/) ; v16 : mode hot (js/mode-hot.js, carte Cupidon) ; v15 : 4 sons de sabre retirés ; v14 : FAQ (js/faq.js) ; // v13 : musique d'ambiance gardée en cache à la première écoute (hors connexion) ; v12 : trois dos Star Wars qui alternent ; v11 : dos Star Wars en acier (dos_galaxie_argent.svg) ; v10 : faces de cartes Star Wars (Cartes/galaxie/) ; v9 : faces de cartes Kawaii (Cartes/kawaii/) ; v8 : dos Kawaii renommés (dos_kawaii_alcuno_*) pour sortir des anciens caches ; v7 : dos Kawaii avec « ALC UNO » ; v6 : dos de cartes Kawaii ; v5 : petits personnages flottants du thème Kawaii ; v4 : album de stickers et thème Kawaii ; v3 : QR code de la partie (js/qrcode.js) ; v2 : cartes HD en WebP (les anciennes .jpg sont supprimées du cache)

// Copié dès l'installation : de quoi jouer en classique sans réseau
const A_PRECHARGER = [
  "./",
  "./index.html",
  "./script.js",
  "./js/qrcode.js",
  "./js/config-lib.js",
  "./js/reglages.js",
  "./js/en-ligne.js",
  "./js/plateau.js",
  "./js/regles.js",
  "./js/mode-hot.js",
  "./js/zizi-coptere.js",
  "./js/poisson.js",
  "./js/synchro-en-ligne.js",
  "./js/retour-demarrage.js",
  "./js/tele.js",
  "./js/stats.js",
  "./js/config-distante.js",
  "./js/stickers.js",
  "./js/faq.js",
  "./js/mouchard.js",
  "./js/piano-accueil.js",
  "./style_alcuno.css",
  "./style_kawaii.css",
  "./style_donjon.css",
  "./style_feux.css",
  "./style_noel.css",
  "./noel/traineau.svg",
  "./noel/sapin.svg",
  "./noel/boule_neige.svg",
  "./noel/deco_fond.svg",
  "./style_chandeleur.css",
  "./chandeleur/poele_sans_citron.svg",
  "./chandeleur/crepe.svg",
  "./chandeleur/deco_fond.svg",
  "./style_valentin.css",
  "./valentin/deco_fond_rose.svg",
  "./valentin/coeur_o.svg",
  "./style_patrick.css",
  "./style_justrose.css",
  "./style_musique.css",
  "./style_halloween.css",
  "./style_annonce_fete.css",
  "./style_poisson.css",
  "./Cartes/dos_uno.svg",
  "./Cartes/dos_justrose.png",
  "./Cartes/dos_halloween.png",
  "./Cartes/dos_galaxie_argent_uno.svg",
  "./Cartes/dos_galaxie_hyperespace_uno.svg",
  "./Cartes/dos_galaxie_planete_uno.svg",
  "./Cartes/dos_kawaii_uno_licorne.svg",
  "./Cartes/dos_kawaii_uno_nuages.svg",
  "./Cartes/dos_kawaii_uno_gourmand.svg",
  "./patrick/deco_fond.svg",
  "./patrick/chapeau.svg",
  "./patrick/pintes.svg",
  "./patrick/trefle_apercu.svg",
  "./justrose/deco_fond.svg",
  "./justrose/accueil_bas.svg",
  "./justrose/feu.svg",
  "./justrose/verre_apercu.svg",
  "./musique/deco_fond.svg",
  "./musique/faisceaux.svg",
  "./musique/egaliseur.svg",
  "./musique/note_rose.svg",
  "./musique/notes_cyan.svg",
  "./musique/piano.svg",
  "./musique/note_apercu.svg",
  "./halloween/deco_fond.svg",
  "./halloween/grain.svg",
  "./halloween/taches_haut.svg",
  "./halloween/accueil.svg",
  "./halloween/citrouilles.svg",
  "./halloween/trainee_titre.svg",
  "./halloween/citrouille_apercu.svg",
  "./stickers/cupcake.svg",
  "./stickers/chat.svg",
  "./stickers/lapin.svg",
  "./stickers/poussin.svg",
  "./stickers/etoile.svg",
  "./stickers/licorne.svg",
  "./stickers/fraise.svg",
  "./stickers/sushi.svg",
  "./stickers/macaron.svg",
  "./stickers/chou.svg",
  "./stickers/nuage.svg",
  "./Cartes/dos_kawaii_alcuno_licorne.svg",
  "./Cartes/dos_kawaii_alcuno_nuages.svg",
  "./Cartes/dos_kawaii_alcuno_gourmand.svg",
  "./stickers/etoile_filante.svg",
  "./stickers/coeur.svg",
  "./stickers/arcenciel.svg",
  "./stickers/sucette.svg",
  "./stickers/fleur.svg",
  "./stickers/bulle.svg",
  "./stickers/glace.svg",
  "./stickers/corne.svg",
  "./stickers/scintille.svg",
  "./manifest.json",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./icones/icone-180.png",
  "./icones/qr_alcuno.svg",
  "./Cartes/carte_doree.svg",
  "./donjon/baillon.svg",
  "./donjon/bandeau.svg",
  "./donjon/chaine.svg",
  "./donjon/chaine_h.svg",
  "./donjon/collier.svg",
  "./donjon/cravache.svg",
  "./donjon/dixhuit.svg",
  "./donjon/flamme.svg",
  "./donjon/flammes.svg",
  "./donjon/fouet.svg",
  "./donjon/levres.svg",
  "./donjon/menottes.svg",
  "./donjon/vibro1.svg",
  "./donjon/vibro2.svg",
  "./donjon/vibro3.svg",
  "./Cartes/dos_donjon.svg",
  "./Cartes/dos_galaxie_argent.svg",
  "./Cartes/dos_galaxie_hyperespace.svg",
  "./Cartes/dos_galaxie_planete.svg",
  "./Cartes/donjon/cinq_bleu.svg",
  "./Cartes/donjon/cinq_jaune.svg",
  "./Cartes/donjon/cinq_rouge.svg",
  "./Cartes/donjon/cinq_vert.svg",
  "./Cartes/donjon/couleur.svg",
  "./Cartes/donjon/cupidon.svg",
  "./Cartes/donjon/deux_bleu.svg",
  "./Cartes/donjon/deux_jaune.svg",
  "./Cartes/donjon/deux_rouge.svg",
  "./Cartes/donjon/deux_vert.svg",
  "./Cartes/donjon/huit_bleu.svg",
  "./Cartes/donjon/huit_jaune.svg",
  "./Cartes/donjon/huit_rouge.svg",
  "./Cartes/donjon/huit_vert.svg",
  "./Cartes/donjon/interdit_bleu.svg",
  "./Cartes/donjon/interdit_jaune.svg",
  "./Cartes/donjon/interdit_rouge.svg",
  "./Cartes/donjon/interdit_vert.svg",
  "./Cartes/donjon/neuf_bleu.svg",
  "./Cartes/donjon/neuf_jaune.svg",
  "./Cartes/donjon/neuf_rouge.svg",
  "./Cartes/donjon/neuf_vert.svg",
  "./Cartes/donjon/plus_2_bleu.svg",
  "./Cartes/donjon/plus_2_jaune.svg",
  "./Cartes/donjon/plus_2_rouge.svg",
  "./Cartes/donjon/plus_2_vert.svg",
  "./Cartes/donjon/plus_4.svg",
  "./Cartes/donjon/quatre_bleu.svg",
  "./Cartes/donjon/quatre_jaune.svg",
  "./Cartes/donjon/quatre_rouge.svg",
  "./Cartes/donjon/quatre_vert.svg",
  "./Cartes/donjon/sept_bleu.svg",
  "./Cartes/donjon/sept_jaune.svg",
  "./Cartes/donjon/sept_rouge.svg",
  "./Cartes/donjon/sept_vert.svg",
  "./Cartes/donjon/six_bleu.svg",
  "./Cartes/donjon/six_jaune.svg",
  "./Cartes/donjon/six_rouge.svg",
  "./Cartes/donjon/six_vert.svg",
  "./Cartes/donjon/switch_bleu.svg",
  "./Cartes/donjon/switch_jaune.svg",
  "./Cartes/donjon/switch_rouge.svg",
  "./Cartes/donjon/switch_vert.svg",
  "./Cartes/donjon/trois_bleu.svg",
  "./Cartes/donjon/trois_jaune.svg",
  "./Cartes/donjon/trois_rouge.svg",
  "./Cartes/donjon/trois_vert.svg",
  "./Cartes/donjon/un_bleu.svg",
  "./Cartes/donjon/un_jaune.svg",
  "./Cartes/donjon/un_rouge.svg",
  "./Cartes/donjon/un_vert.svg",
  "./Cartes/donjon/zero_bleu.svg",
  "./Cartes/donjon/zero_jaune.svg",
  "./Cartes/donjon/zero_rouge.svg",
  "./Cartes/donjon/zero_vert.svg",
  "./Cartes/galaxie/cinq_bleu.svg",
  "./Cartes/galaxie/cinq_jaune.svg",
  "./Cartes/galaxie/cinq_rouge.svg",
  "./Cartes/galaxie/cinq_vert.svg",
  "./Cartes/galaxie/couleur.svg",
  "./Cartes/galaxie/cupidon.svg",
  "./Cartes/galaxie/deux_bleu.svg",
  "./Cartes/galaxie/deux_jaune.svg",
  "./Cartes/galaxie/deux_rouge.svg",
  "./Cartes/galaxie/deux_vert.svg",
  "./Cartes/galaxie/huit_bleu.svg",
  "./Cartes/galaxie/huit_jaune.svg",
  "./Cartes/galaxie/huit_rouge.svg",
  "./Cartes/galaxie/huit_vert.svg",
  "./Cartes/galaxie/interdit_bleu.svg",
  "./Cartes/galaxie/interdit_jaune.svg",
  "./Cartes/galaxie/interdit_rouge.svg",
  "./Cartes/galaxie/interdit_vert.svg",
  "./Cartes/galaxie/neuf_bleu.svg",
  "./Cartes/galaxie/neuf_jaune.svg",
  "./Cartes/galaxie/neuf_rouge.svg",
  "./Cartes/galaxie/neuf_vert.svg",
  "./Cartes/galaxie/plus_2_bleu.svg",
  "./Cartes/galaxie/plus_2_jaune.svg",
  "./Cartes/galaxie/plus_2_rouge.svg",
  "./Cartes/galaxie/plus_2_vert.svg",
  "./Cartes/galaxie/plus_4.svg",
  "./Cartes/galaxie/quatre_bleu.svg",
  "./Cartes/galaxie/quatre_jaune.svg",
  "./Cartes/galaxie/quatre_rouge.svg",
  "./Cartes/galaxie/quatre_vert.svg",
  "./Cartes/galaxie/sept_bleu.svg",
  "./Cartes/galaxie/sept_jaune.svg",
  "./Cartes/galaxie/sept_rouge.svg",
  "./Cartes/galaxie/sept_vert.svg",
  "./Cartes/galaxie/six_bleu.svg",
  "./Cartes/galaxie/six_jaune.svg",
  "./Cartes/galaxie/six_rouge.svg",
  "./Cartes/galaxie/six_vert.svg",
  "./Cartes/galaxie/switch_bleu.svg",
  "./Cartes/galaxie/switch_jaune.svg",
  "./Cartes/galaxie/switch_rouge.svg",
  "./Cartes/galaxie/switch_vert.svg",
  "./Cartes/galaxie/trois_bleu.svg",
  "./Cartes/galaxie/trois_jaune.svg",
  "./Cartes/galaxie/trois_rouge.svg",
  "./Cartes/galaxie/trois_vert.svg",
  "./Cartes/galaxie/un_bleu.svg",
  "./Cartes/galaxie/un_jaune.svg",
  "./Cartes/galaxie/un_rouge.svg",
  "./Cartes/galaxie/un_vert.svg",
  "./Cartes/galaxie/zero_bleu.svg",
  "./Cartes/galaxie/zero_jaune.svg",
  "./Cartes/galaxie/zero_rouge.svg",
  "./Cartes/galaxie/zero_vert.svg",
  "./Cartes/kawaii/cinq_bleu.svg",
  "./Cartes/kawaii/cinq_jaune.svg",
  "./Cartes/kawaii/cinq_rouge.svg",
  "./Cartes/kawaii/cinq_vert.svg",
  "./Cartes/kawaii/couleur.svg",
  "./Cartes/kawaii/cupidon.svg",
  "./Cartes/kawaii/deux_bleu.svg",
  "./Cartes/kawaii/deux_jaune.svg",
  "./Cartes/kawaii/deux_rouge.svg",
  "./Cartes/kawaii/deux_vert.svg",
  "./Cartes/kawaii/huit_bleu.svg",
  "./Cartes/kawaii/huit_jaune.svg",
  "./Cartes/kawaii/huit_rouge.svg",
  "./Cartes/kawaii/huit_vert.svg",
  "./Cartes/kawaii/interdit_bleu.svg",
  "./Cartes/kawaii/interdit_jaune.svg",
  "./Cartes/kawaii/interdit_rouge.svg",
  "./Cartes/kawaii/interdit_vert.svg",
  "./Cartes/kawaii/neuf_bleu.svg",
  "./Cartes/kawaii/neuf_jaune.svg",
  "./Cartes/kawaii/neuf_rouge.svg",
  "./Cartes/kawaii/neuf_vert.svg",
  "./Cartes/kawaii/plus_2_bleu.svg",
  "./Cartes/kawaii/plus_2_jaune.svg",
  "./Cartes/kawaii/plus_2_rouge.svg",
  "./Cartes/kawaii/plus_2_vert.svg",
  "./Cartes/kawaii/plus_4.svg",
  "./Cartes/kawaii/quatre_bleu.svg",
  "./Cartes/kawaii/quatre_jaune.svg",
  "./Cartes/kawaii/quatre_rouge.svg",
  "./Cartes/kawaii/quatre_vert.svg",
  "./Cartes/kawaii/sept_bleu.svg",
  "./Cartes/kawaii/sept_jaune.svg",
  "./Cartes/kawaii/sept_rouge.svg",
  "./Cartes/kawaii/sept_vert.svg",
  "./Cartes/kawaii/six_bleu.svg",
  "./Cartes/kawaii/six_jaune.svg",
  "./Cartes/kawaii/six_rouge.svg",
  "./Cartes/kawaii/six_vert.svg",
  "./Cartes/kawaii/switch_bleu.svg",
  "./Cartes/kawaii/switch_jaune.svg",
  "./Cartes/kawaii/switch_rouge.svg",
  "./Cartes/kawaii/switch_vert.svg",
  "./Cartes/kawaii/trois_bleu.svg",
  "./Cartes/kawaii/trois_jaune.svg",
  "./Cartes/kawaii/trois_rouge.svg",
  "./Cartes/kawaii/trois_vert.svg",
  "./Cartes/kawaii/un_bleu.svg",
  "./Cartes/kawaii/un_jaune.svg",
  "./Cartes/kawaii/un_rouge.svg",
  "./Cartes/kawaii/un_vert.svg",
  "./Cartes/kawaii/zero_bleu.svg",
  "./Cartes/kawaii/zero_jaune.svg",
  "./Cartes/kawaii/zero_rouge.svg",
  "./Cartes/kawaii/zero_vert.svg",
  "./Cartes/cinq_bleu.webp",
  "./Cartes/cinq_jaune.webp",
  "./Cartes/cinq_rouge.webp",
  "./Cartes/cinq_vert.webp",
  "./Cartes/couleur.webp",
  "./Cartes/cupidon.webp",
  "./Cartes/coup_de_foudre_coeurs.svg",
  "./Cartes/deux_bleu.webp",
  "./Cartes/deux_jaune.webp",
  "./Cartes/deux_rouge.webp",
  "./Cartes/deux_vert.webp",
  "./Cartes/dos.gif",
  "./Cartes/huit_bleu.webp",
  "./Cartes/huit_jaune.webp",
  "./Cartes/huit_rouge.webp",
  "./Cartes/huit_vert.webp",
  "./Cartes/interdit_bleu.webp",
  "./Cartes/interdit_jaune.webp",
  "./Cartes/interdit_rouge.webp",
  "./Cartes/interdit_vert.webp",
  "./Cartes/neuf_bleu.webp",
  "./Cartes/neuf_jaune.webp",
  "./Cartes/neuf_rouge.webp",
  "./Cartes/neuf_vert.webp",
  "./Cartes/plus_2_bleu.webp",
  "./Cartes/plus_2_jaune.webp",
  "./Cartes/plus_2_rouge.webp",
  "./Cartes/plus_2_vert.webp",
  "./Cartes/plus_4.webp",
  "./Cartes/quatre_bleu.webp",
  "./Cartes/quatre_jaune.webp",
  "./Cartes/quatre_rouge.webp",
  "./Cartes/quatre_vert.webp",
  "./Cartes/sept_bleu.webp",
  "./Cartes/sept_jaune.webp",
  "./Cartes/sept_rouge.webp",
  "./Cartes/sept_vert.webp",
  "./Cartes/six_bleu.webp",
  "./Cartes/six_jaune.webp",
  "./Cartes/six_rouge.webp",
  "./Cartes/six_vert.webp",
  "./Cartes/switch_bleu.webp",
  "./Cartes/switch_jaune.webp",
  "./Cartes/switch_rouge.webp",
  "./Cartes/switch_vert.webp",
  "./Cartes/trois_bleu.webp",
  "./Cartes/trois_jaune.webp",
  "./Cartes/trois_rouge.webp",
  "./Cartes/trois_vert.webp",
  "./Cartes/un_bleu.webp",
  "./Cartes/un_jaune.webp",
  "./Cartes/un_rouge.webp",
  "./Cartes/un_vert.webp",
  "./Cartes/zero_bleu.webp",
  "./Cartes/zero_jaune.webp",
  "./Cartes/zero_rouge.webp",
  "./Cartes/zero_vert.webp",
];

// Sons (dossier Sons/) : copiés aussi, pour en avoir hors connexion. Un par un et sans bloquer :
// un fichier absent (son pas encore ajouté) n'empêche pas l'installation du reste.
const SONS_A_PRECHARGER = ["zizicoptere", "mode_hard", "cartes", "doree", "tiens_gueule", "bouton", "pigeon", "tour", "eau", "sons_on", "credits", "reglage_son", "no_wifi", "distribuer_gorgees", "annuler_gorgees", "annuler_0_gorgees", "regles", "accessibilite_on", "etoile", "traineau_noel"]
  .concat(["sabre/sabre_01", "sabre/sabre_02", "sabre/sabre_05", "sabre/sabre_07", "sabre/sabre_09", "sabre/sabre_11", "sabre/sabre_14", "sabre/sabre_15", "sabre/sabre_18", "sabre/sabre_22", "sabre/sabre_26", "sabre/sabre_31", "sabre/sabre_33", "sabre/sabre_37", "sabre/sabre_40", "sabre/sabre_41", "sabre/sabre_48"])
  .concat(["bdsm_buttons/bdsm_sound_effect", "bdsm_buttons/bdsm_sound_effect1_01", "bdsm_buttons/bdsm_sound_effect1_07", "bdsm_buttons/bdsm_sound_effect1_12", "bdsm_buttons/bdsm_sound_effect1_17", "bdsm_buttons/bdsm_sound_effect1_23", "bdsm_buttons/bdsm_sound_effect1_25", "bdsm_buttons/bdsm_sound_effect1_27", "bdsm_buttons/bdsm_sound_effect1_30", "bdsm_buttons/bdsm_sound_effect1_37", "bdsm_buttons/bdsm_sound_effect1_46"])
  .concat(["saxo/saxo_03", "saxo/saxo_07", "saxo/saxo_08", "saxo/saxo_15", "saxo/saxo_26", "saxo/saxo_32", "saxo/saxo_37", "saxo/saxo_38"])
  .concat(["piano/piano_fa4", "piano/piano_fa4d", "piano/piano_sol4", "piano/piano_sol4d", "piano/piano_la4", "piano/piano_la4d", "piano/piano_si4", "piano/piano_do5", "piano/piano_do5d", "piano/piano_re5", "piano/piano_re5d", "piano/piano_mi5", "piano/piano_fa5", "piano/piano_fa5d", "piano/piano_sol5"])
  .map((nom) => `./Sons/${nom}.mp3`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(A_PRECHARGER)
        .then(() => Promise.all(SONS_A_PRECHARGER.map((son) => cache.add(son).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);
  // Firebase, polices, etc. : pas touché (le mode en ligne a de toute façon besoin du réseau)
  if (url.origin !== self.location.origin) return;
  // Une seule copie par fichier : on ignore le « ?t=... » anti-cache de index.html
  const cle = url.origin + url.pathname;

  // Musique d'ambiance : le jeu la télécharge en entier (Web Audio). Fichiers lourds (1 à 3 Mo) qui ne changent pas : on ne les garde
  // qu'à la première écoute (pas de préchargement des 10 morceaux), et ensuite on les sert d'abord depuis le cache, pour que la musique
  // marche hors connexion (mode avion). Un morceau modifié = changer CACHE ci-dessus (tests/test_cache.js le vérifie).
  if (url.pathname.includes("/Sons/musique")) {
    if (requete.headers.has("range")) return; // (lecture en flux par morceaux : réseau, comme avant)
    event.respondWith(
      caches.match(cle).then((enCache) => enCache || fetch(requete).then((reponse) => {
        if (reponse.ok && reponse.status === 200) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(cle, copie));
        }
        return reponse;
      }))
    );
    return;
  }

  // La page (index.html) est toujours redemandée au serveur (« no-cache » : revalidée, un 304 suffit). Sinon GitHub Pages la laisse
  // 10 minutes dans le cache du navigateur : juste après une mise en ligne, un téléphone avait l'ANCIENNE page avec les NOUVEAUX
  // fichiers du jeu (leur « ?t=… » les rend toujours neufs), d'où des plantages d'un seul coup (« null is not an object » à
  // reglages.js, « estIOS is not defined »…, onglet Santé d'Alcuno Stats).
  const page = requete.mode === "navigate" || url.pathname.endsWith("/index.html");
  event.respondWith(
    (page ? fetch(requete.url, { cache: "no-cache", credentials: "same-origin" }) : fetch(requete))
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(cle, copie));
        }
        return reponse;
      })
      .catch(() =>
        caches.match(cle).then((enCache) => {
          if (enCache) return enCache;
          // Page d'accueil demandée avec une autre adresse (ex. ?v=...) : on sert index.html
          if (requete.mode === "navigate") return caches.match(new URL("./index.html", self.registration.scope).href);
          return Response.error();
        })
      )
  );
});
