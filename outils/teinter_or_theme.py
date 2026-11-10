# -*- coding: utf-8 -*-
"""
Teinte le jaune doré du jeu de base aux couleurs d'un thème de fête.

Le jeu de base (style_alcuno.css) met du jaune doré partout : textes, interrupteurs on/off, curseurs de volume,
joueur actif, bandeau du tour, halo qui rappelle de jouer, bordures… Un thème qui veut « tout dans le thème »
doit tout recolorer. Cet outil lit style_alcuno.css, garde chaque règle qui contient du doré, remplace le doré par
les couleurs du thème et recopie la règle sous html[data-theme="<thème>"] (avec ses @media). Les animations
(@keyframes) dorées sont recopiées sous un autre nom, et les éléments qui les utilisent sont rebranchés dessus.

Ce qui RESTE doré (voulu) : fenêtres de déblocage des thèmes secrets, halo de sélection des pastilles de thème,
sticker gagné, carte dorée (c'est son nom), générique Star Wars, et les règles propres aux autres thèmes.

Le résultat est écrit ENTRE deux marqueurs au début de style_<thème>.css : les règles écrites à la main dans le
thème, plus bas, gardent le dernier mot à égalité.

Utilisation :  python3 outils/teinter_or_theme.py valentin
(couleurs de remplacement : dictionnaire THEMES plus bas ; relancer après chaque changement de style_alcuno.css)
"""
import re, sys, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Doré du jeu de base -> couleur du thème. Clés : couleurs en minuscules, « r,v,b » pour les rgb()/rgba().
THEMES = {
    "valentin": {
        "#ffd700": "#ffe3ee", "255,215,0": "255,200,222",
        "120,70,0": "138,18,68",
        "255,210,38": "255,184,210", "#ffcc00": "#ff9ec2", "#ffea70": "#ffe0ec", "#ffe680": "#ffe4ef",
        "255,200,40": "255,170,200", "255,223,90": "255,200,222", "#e9d9a8": "#f6d6e3", "#d9c38a": "#e8bcd0",
        "#ffe27a": "#ffe0ec", "#c8880a": "#b0185a", "255,220,90": "255,200,222", "255,216,77": "255,190,214",
        "255,200,0": "255,160,195", "#ffe066": "#ffd3e4", "#ffd54f": "#ffc2da", "#ffd23f": "#ffb8d2",
        "#e8a900": "#f06292", "#fff3a8": "#fff0f6", "#fff0a8": "#fff0f6", "#f2b400": "#f48fb1",
        "255,244,190": "255,236,244",
    },
}

# Sélecteurs laissés en doré (voir plus haut)
GARDER_OR = re.compile(r"fenetre|pastilleTheme|stickerGagne|[Dd]oree|culsec|generique|data-theme|etoileFilante|couronneTitre")

def couleur_cle(m):
    return m.group(0).lower()

def teinter(texte, table):
    """Remplace le doré dans un morceau de CSS. Renvoie (texte, nombre de remplacements)."""
    n = 0
    def hexa(m):
        nonlocal n
        k = m.group(0).lower()
        if k in table: n += 1; return table[k]
        return m.group(0)
    def rgb(m):
        nonlocal n
        k = ",".join(x.strip() for x in m.group(2).split(",")[:3])
        if k in table:
            n += 1
            reste = m.group(2).split(",")[3:]
            return f"{m.group(1)}({table[k]}{(',' + ','.join(reste)) if reste else ''})"
        return m.group(0)
    texte = re.sub(r"#[0-9a-fA-F]{6}\b", hexa, texte)
    texte = re.sub(r"(rgba?)\(([^)]*)\)", rgb, texte)
    return texte, n

def sans_commentaires(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)

def blocs(css):
    """Découpe du CSS en (prélude, contenu) : règles, @media {…} (récursif), @keyframes {…}."""
    i, n, res = 0, len(css), []
    while i < n:
        j = css.find("{", i)
        if j < 0: break
        prelude = css[i:j].strip()
        k, prof = j + 1, 1
        while k < n and prof:
            if css[k] == "{": prof += 1
            elif css[k] == "}": prof -= 1
            k += 1
        res.append((prelude, css[j + 1:k - 1]))
        i = k
    return res

def decouper_selecteurs(sel):
    parts, prof, cur = [], 0, ""
    for c in sel:
        if c in "([": prof += 1
        elif c in ")]": prof -= 1
        if c == "," and prof == 0: parts.append(cur.strip()); cur = ""
        else: cur += c
    if cur.strip(): parts.append(cur.strip())
    return parts

def portee(sel, theme):
    # :where(…) n'ajoute AUCUNE priorité : la règle teintée garde la même force que l'originale, donc une règle plus
    # précise du jeu de base (ex. le fond transparent du bouton « X » dans la liste des joueurs en ligne) l'emporte toujours.
    h = f':where(html[data-theme="{theme}"])'
    if sel.startswith(":root"): return h + sel[5:]
    if re.match(r"html\b", sel): return h + sel[4:]
    return h + " " + sel

def proprietes(contenu):
    return [d.split(":", 1)[0].strip().lower() for d in contenu.split(";") if ":" in d]

def traiter(liste, theme, table, anims_or, sortie, retrait=""):
    # Une propriété redéfinie PLUS LOIN par une règle au sélecteur identique (même endroit : même @media) n'est pas
    # teintée : à force égale, c'est la règle d'après qui s'applique dans le jeu de base (ex. le nom du joueur actif de
    # la télé : doré, puis plus loin à la couleur du joueur actif). Sinon la règle teintée, chargée après, la réécraserait.
    redefinies = set()
    for i, (prelude, contenu) in enumerate(liste):
        if prelude.startswith("@"): continue
        for j in range(i + 1, len(liste)):
            if liste[j][0] == prelude:
                for prop in proprietes(liste[j][1]): redefinies.add((i, prop))
    for i, (prelude, contenu) in enumerate(liste):
        if prelude.startswith("@media") or prelude.startswith("@supports"):
            dedans = []
            traiter(blocs(contenu), theme, table, anims_or, dedans, retrait + "  ")
            if dedans: sortie.append(f"{retrait}{prelude}{{\n" + "".join(dedans) + f"{retrait}}}\n")
            continue
        if prelude.startswith("@"): continue  # @keyframes (traités à part), @font-face…
        sels = [s for s in decouper_selecteurs(prelude) if not GARDER_OR.search(s)]
        if not sels: continue
        decls = []
        for d in contenu.split(";"):
            d = d.strip()
            if not d or ":" not in d: continue
            prop = d.split(":", 1)[0].strip().lower()
            if (i, prop) in redefinies: continue
            if prop in ("animation", "animation-name"):
                val = d
                for nom in anims_or:
                    val = re.sub(rf"\b{re.escape(nom)}\b", nom + "_" + theme, val)
                if val != d: decls.append(val); continue
            t, nb = teinter(d, table)
            if nb: decls.append(t)
        if decls:
            sortie.append(f"{retrait}{', '.join(portee(s, theme) for s in sels)}{{ " + "; ".join(decls) + "; }\n")

def main():
    theme = sys.argv[1] if len(sys.argv) > 1 else "valentin"
    table = THEMES[theme]
    css = sans_commentaires(open(os.path.join(RACINE, "style_alcuno.css"), encoding="utf-8").read())
    tout = blocs(css)
    # animations dorées : recopiées sous un autre nom
    anims_or, kf = [], []
    def cherche_kf(liste):
        for prelude, contenu in liste:
            if prelude.startswith("@media"): cherche_kf(blocs(contenu)); continue
            m = re.match(r"@(-webkit-)?keyframes\s+([\w-]+)", prelude)
            if m:
                t, nb = teinter(contenu, table)
                if nb and m.group(2) not in anims_or:
                    anims_or.append(m.group(2))
                    kf.append(f"@keyframes {m.group(2)}_{theme}{{{t}}}\n")
    cherche_kf(tout)
    sortie = []
    traiter(tout, theme, table, anims_or, sortie)
    bloc = ("/* === DÉBUT : doré du jeu de base teinté au thème (généré par outils/teinter_or_theme.py " + theme + " : ne pas modifier à la main) === */\n"
            + "".join(kf) + "".join(sortie)
            + "/* === FIN du doré teinté (généré) === */\n")
    fichier = os.path.join(RACINE, f"style_{theme}.css")
    s = open(fichier, encoding="utf-8").read()
    s = re.sub(r"/\* === DÉBUT : doré du jeu de base teinté.*?/\* === FIN du doré teinté \(généré\) === \*/\n", "", s, flags=re.S)
    fin_entete = s.index("*/") + 2  # juste après le commentaire d'en-tête du thème
    s = s[:fin_entete] + "\n\n" + bloc + s[fin_entete:]
    open(fichier, "w", encoding="utf-8").write(s)
    print(f"{theme} : {len(sortie)} règles teintées, {len(kf)} animations recopiées ({', '.join(anims_or)})")

if __name__ == "__main__":
    main()
