# Dos des cartes Shifumi (duel Shifumi « cartes », js/regles.js) : un dos commun à tous les thèmes, plus un dos pour
# Star Wars (galaxie), Kawaii et BDSM (donjon), faits à partir des dos de cartes de ces thèmes. Au milieu : les trois
# ronds pierre / feuille / ciseaux (outils/ronds_shifumi.png, découpés dans l'image fournie), recopiés dans le
# SVG (une image SVG utilisée en fond de carte ne charge aucun fichier extérieur).
# Givre : le dos commun, givré en CSS comme les autres cartes. Lancer depuis la racine du jeu :
#   python3 outils/generer_dos_shifumi.py
# Android : le dos Star Wars a des flous SVG (cassés sur Android, comme les autres dos du thème) : une copie en image,
# Cartes/shifumi/dos_shifumi_galaxie_android.webp (300 x 468), est faite à partir du SVG (capture du navigateur).
import base64, re
from PIL import Image

RONDS = "outils/ronds_shifumi.png"
_l, _h = Image.open(RONDS).size
_donnees = base64.b64encode(open(RONDS, "rb").read()).decode()

def ronds(cx, cy, largeur):
    """Les trois ronds, centrés en (cx, cy), sur cette largeur (unités du dos : 100 x 156)"""
    h = largeur * _h / _l
    return (f'<image x="{cx - largeur / 2:.2f}" y="{cy - h / 2:.2f}" width="{largeur:.2f}" height="{h:.2f}" '
            f'href="data:image/png;base64,{_donnees}"/>')

def sans_alc_uno(svg):
    """Retire les groupes du texte « ALC / UNO » des dos de thème"""
    return re.sub(r'<g transform="rotate\(-20 50 78\)"[^>]*>\s*<text[^>]*>ALC</text>\s*<text[^>]*>UNO</text>\s*</g>', "", svg)

def avant_fin(svg, ajout):
    i = svg.rindex("</svg>")
    return svg[:i] + ajout + svg[i:]

# Dos commun : le cadre blanc et le fond noir du dos du jeu, les trois ronds au milieu
commun = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 156">
  <rect width="100" height="156" rx="9" fill="#fff"/>
  <rect x="5" y="5" width="90" height="146" rx="6" fill="#000"/>
  {ronds(50, 78, 84)}
</svg>
'''
open("Cartes/shifumi/dos_shifumi.svg", "w").write(commun)

# Star Wars : le dos argenté du thème, sans son ovale à sabre ni « ALC UNO », les trois ronds à la place
galaxie = open("Cartes/dos_galaxie_argent.svg").read()
# (l'ovale du milieu et son sabre : de l'ovale jusqu'au texte « ALC UNO »)
galaxie = galaxie[:galaxie.index('<ellipse cx="50" cy="78" rx="46"')] + galaxie[galaxie.index('<g transform="rotate(-20 50 78)"'):]
galaxie = sans_alc_uno(galaxie)
open("Cartes/shifumi/dos_shifumi_galaxie.svg", "w").write(avant_fin(galaxie, ronds(50, 78, 82)))

# Kawaii : le dos licorne du thème, sans « ALC UNO » ; les ronds sur son ovale blanc
kawaii = sans_alc_uno(open("Cartes/dos_kawaii_alcuno_licorne.svg").read())
kawaii = kawaii.replace('<rect x="7.5" y="7.5"', ronds(50, 80, 78) + '<rect x="7.5" y="7.5"', 1)
open("Cartes/shifumi/dos_shifumi_kawaii.svg", "w").write(kawaii)

# BDSM : le cœur masqué du dos du thème, plus petit en haut, les trois ronds en dessous
donjon = open("Cartes/dos_donjon.svg").read()
debut = donjon.index('<path d="M26 74')
fin = donjon.rindex("</svg>")
cadre, coeur = donjon[:debut], donjon[debut:fin]
donjon = (cadre + '<g transform="translate(50 46) scale(.55) translate(-50 -83)">' + coeur + '</g>'
  + ronds(50, 104, 72) + "</svg>\n")
open("Cartes/shifumi/dos_shifumi_donjon.svg", "w").write(donjon)
print("Dos Shifumi écrits dans Cartes/shifumi/")
