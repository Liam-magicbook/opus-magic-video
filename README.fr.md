# opus-magic-video

**Six courts métrages, chaque image calculée par du code.** Aucune banque d'images, aucun logiciel de montage,
aucun glisser-déposer sur une timeline — chaque image est produite par `renderAt(t)`, et la musique est synthétisée
en Python à partir de la même table d'événements.

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | **Français**

<img src="docs/preview/hero.gif" width="720" alt="1,5 seconde de quatre des six films : MG papier, éclaboussure dessinée à la main, aventure pixel, dossier en demi-teintes">

<sub>1,5 s de quatre des six films, assemblé en 2×2. En haut à gauche `deepseek-one-line`, en haut à droite `cel-boil-splash`, en bas à gauche `pixel-teyvat`, en bas à droite `pdoom`.</sub>

---

## Les films

| Aperçu | Film | Durée | Style | Fichier |
|:---:|---|---:|---|---|
| <img src="docs/preview/deepseek-one-line.jpg" width="260"> | [`deepseek-one-line/`](deepseek-one-line/) | 60s | **Huit chapitres, huit matières** : papier à dessin / salle serveur / ticket de caisse / oscilloscope / tissu / métal usiné / strates rocheuses / retour au papier. 28 plans pour raconter une seule courbe de prix | [`out/video.mp4`](deepseek-one-line/out/video.mp4) · 2048×858 · 27 Mo |
| <img src="docs/preview/deepseek-v41-flash.jpg" width="260"> | [`deepseek-v41-flash/`](deepseek-v41-flash/) | 60s | **Motion graphics papier / stickers**, décryptage technique : plus on lit, moins chaque token coûte | Non rendu — images fixes dans [`out/stills/`](deepseek-v41-flash/out/stills/) |
| <img src="docs/preview/cel-boil-splash.jpg" width="260"> | [`cel-boil-splash/`](cel-boil-splash/) | 10s | **Dessin image par image / line boil**, un esprit d'eau se défait et se reforme | [`out/video.mp4`](cel-boil-splash/out/video.mp4) · 1920×1080 · 36 Mo |
| <img src="docs/preview/pixel-teyvat.jpg" width="260"> | [`pixel-teyvat/`](pixel-teyvat/) | 10s | **Aventure pixel 320×180 + CRT**, ouverture de coffre, cycle jour-nuit | [`out/video.mp4`](pixel-teyvat/out/video.mp4) · 1920×1080 · 13 Mo |
| <img src="docs/preview/pdoom.jpg" width="260"> | [`pdoom/`](pdoom/) | 156s | **Dossier rétro en demi-teintes**, 47 scènes / 46 lignes de paroles, la jauge P(doom) monte quatre fois | [`pdoom-web.mp4`](pdoom/pdoom-web.mp4) · 1920×1080 · 79 Mo |
| <img src="docs/preview/the-fuse.jpg" width="260"> | [`the-fuse/`](the-fuse/) | 30s | **Croquis urbain · plume et lavis** : un dessinateur de rue peint l'apocalypse dans son carnet ; une ligne orange, qui est aussi la mèche, traverse huit doubles pages, chaque trait calé sur la chanson | [`the-fuse-30s.mp4`](the-fuse/the-fuse-30s.mp4) · 1920×1080 · 47 Mo |

<sub>Les vignettes sont extraites des films terminés par [`docs/make_preview.sh`](docs/make_preview.sh) — ce ne sont pas des maquettes.</sub>

## Une image = une fonction pure

Les quatre premiers films partagent **une timeline dans un fichier unique, avec un seek déterministe via
`window.renderAt(t)`** — image, musique et effets sonores lisent tous le même `cues.json`, donc changer un instant
ne se fait qu'à un seul endroit :

```
cues.json ──┬──> index.html   renderAt(t) ──> capture image par image ──> ffmpeg ──> out/video.mp4
            └──> audio.py     synthesize() ──> out/audio.wav ───────────┘
```

Comme l'image est entièrement pilotée par le temps, le même code produit des images identiques sur n'importe quelle
machine : on peut reprendre un rendu interrompu, rendre une seule section pour vérifier la composition, ou itérer
sur des images fixes sans attendre le film entier.

`pdoom/` est l'exception longue durée : 156 secondes, musique issue d'une source indépendante, timeline dérivée des
horodatages au mot dans `data/lyrics.json`. Il utilise donc `build.sh` pour un rendu par blocs
(bruitage → rendu → multiplexage → affiche → sous-titres).

`the-fuse/` est l'exception longue durée dans un autre style : sa timeline complète fait aussi 156,7 secondes, mais
le dépôt contient la version showcase de 30 secondes et tout le code. Son moteur plume-et-lavis vient de
[Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) ; le montage, les huit doubles pages et le bruitage sont
nouveaux pour ce film.

Il n'y a qu'un seul moteur de rendu : lancer un serveur statique local → attendre `window.__ready` → parcourir
`renderAt(t)` → diriger les captures vers ffmpeg (`tmix` pour le flou de mouvement) → H.264 + AAC.

## Arborescence

```
lib/audio/            mgaudio : moteur de synthèse + banque d'échantillons CC0 (partagé par 4 films)
requirements.txt      dépendances de bande son (numpy/scipy/soundfile/numba/pedalboard…)
docs/preview/         vignettes et animation du README
docs/make_preview.sh  ré-extrait les vignettes depuis les films terminés
<films>/              index.html · cues.json · audio.py · assets/ · out/
```

`out/stills/` contient des images de vérification à des instants donnés — de quoi juger la composition sans rendre
le film entier. `deepseek-one-line/out/sheet.png` est une planche contact à raison d'une case toutes les 2 secondes,
le moyen le plus rapide de juger le rythme global.

Conventions propres à chaque film (détails dans le `README.md` de chacun) :

- `deepseek-one-line/` — `index.html` contient la table `SHOTS` de 28 plans et les keyframes caméra `camAt()` ;
  `docs/TREATMENT.md` est le traitement du réalisateur (matières par chapitre, table des plans, table du design
  sonore) ; `out/sheet/` est une planche contact par seconde (non suivie).
- `deepseek-v41-flash/`, `pixel-teyvat/`, `cel-boil-splash/` — `js/` regroupe les modules de scène, `assets/` les
  polices et les textures.
- `pdoom/` — `film/` est le projet lui-même ; `build.sh` reconstruit tout (bruitage → rendu → multiplexage → affiche → sous-titres).
- `the-fuse/` — `film.js` est le montage, `spreads.js` les huit doubles pages, `cues.json` / `events.json` la source
  de temps partagée ; `build.sh` reconstruit le film complet de 156,7 s (Lemo-Opuscar doit être dans `$LIB`).

## Lancer

```bash
# dépendances
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd pixel-teyvat && npm install        # une fois par dossier de film

# aperçu (n'écrit rien)
cd deepseek-one-line && node tools/serve.mjs     # → http://127.0.0.1:8777/index.html

# images fixes
node harness/render.mjs . --stills 0.5,5.6

# musique (verrouillée sur les instants de cues.json)
.venv/bin/python audio.py                          # → out/audio.wav

# rendu final
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4

# rafraîchir les vignettes du README
./docs/make_preview.sh
```

Nécessite Google Chrome installé localement (le moteur le pilote via `puppeteer-core` ; il ne télécharge pas
Chromium) et `ffmpeg`.

Les `node_modules` de `deepseek-one-line` et `deepseek-v41-flash` sont des liens symboliques locaux (vers
`mg-styles-15/node_modules`) : après un clone, lancez vous-même `npm i puppeteer-core` — c'est la seule dépendance
dont `deepseek-one-line` a besoin, il n'utilise pas d3.

## Reproduire le rendu d'Opus 5.5 avec un petit budget

Pour être direct : **la qualité de ces films ne vient pas d'un modèle plus fort, mais de trois contraintes
d'ingénierie.** N'importe quel modèle acceptant d'écrire du code peut en atteindre 70 % s'il respecte ces trois
points ; à l'inverse, le meilleur modèle sans contraintes ne produit que des images qui se lisent mais ne ressemblent
pas à des œuvres.

**① Un seek déterministe, pas une animation qui tourne toute seule.**
L'image doit être une fonction pure de `renderAt(t)` — même `t`, même image, toujours. C'est seulement à ce prix que
« modifier » a un sens : on change une chose et on ne re-rend que les images concernées ; en cas de doute, on rend une
section pour vérifier. Une animation CSS qui tourne seule, ou un `requestAnimationFrame` qui dérive seul, ne donnent
ni alignement image par image ni possibilité de re-rendu.

**② Une seule source de temps, lue par l'image et le son.**
Un même événement (`ev`) dans `cues.json` décide à la fois « à 12,4 s cette image s'abat » et « à 12,4 s ce son
frappe ». La reprise la plus coûteuse n'est pas le rendu, c'est la désynchronisation son-image — sortez le temps
dans des données et ce bug n'existe structurellement plus.

**③ La matière d'abord, le mouvement de caméra ensuite.**
Les huit chapitres de `deepseek-one-line` tiennent parce que chacun s'engage d'abord sur une matière physique (papier,
ticket, oscilloscope, tissu…) avant de faire s'y adapter la même ligne. Se demander « en quoi est faite cette section »
avant « comment la caméra bouge » est bien plus rapide et évite de dégénérer en texte avec fondus.

Le coût, honnêtement :

| Poste | Coût |
|---|---|
| Puissance de rendu | **0** — Chrome local + ffmpeg, aucun GPU loué |
| Rendu de 60 s | ~2 minutes à 3 workers (mesuré sur `deepseek-one-line`) |
| Musique de 10 s | 3 à 8 secondes (`mgaudio`, synthèse numpy pure, aucun abonnement à une banque d'échantillons) |
| Tokens du modèle | **le poste dominant**. Du concept à la livraison, des dizaines de tours ; ce qu'on économise, c'est du calcul, pas de la réflexion |

« Petit budget » signifie donc exactement ceci : **déplacer le coût du calcul vers la conception de contraintes.**
Cela baisse encore quand une bibliothèque de références est disponible — choisissez un style existant, changez les
instants dans `cues.json` et une variable de matière, et vous voyez votre propre version en quelques minutes. C'est
là la vraie valeur des dépôts `video_prototype/` : ils ne vous font pas inventer à partir de zéro, ils vous font
modifier **quelque chose qui tourne déjà**.

## Contraintes

- Durée / résolution / fps vivent dans `window.DEMO` de chaque `index.html` ou dans `cues.json` ; le moteur les lit.
- L'image doit être entièrement pilotée par `renderAt(t)` ; ne laissez pas une animation CSS tourner seule — le rendu
  image par image dériverait.
- Son et image partagent les `ev` de `cues.json` : ajouter un temps visuel impose d'ajouter l'effet sonore dans `audio.py`.
- Sur une coupe franche à l'intérieur d'un chapitre, une animation dépendant du temps absolu doit utiliser l'horloge
  du chapitre (`t - début du chapitre`), pas le `lt` interne au plan, sinon tout est décalé après la coupe.
- Pour les films sombres et finement texturés (par ex. `deepseek-one-line`), rendre avec `--mb 3 --shutter 0.5` afin
  que les travellings rapides ne tremblent pas.

## Remerciements

Rien de tout cela n'a été inventé de zéro. Les dépôts amont ci-dessous ont fourni la structure, les exemples et la
méthodologie ; ce projet est une réécriture par-dessus :

| Dépôt | Auteur | Rôle ici | Licence |
|---|---|---|---|
| [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Vincentwei1021 | **Source du moteur de rendu et de `mgaudio`.** `harness/render.mjs` et `lib/audio/` en sont directement issus ; `cel-boil-splash` est adapté de `demos/05-cel-boil`, `pixel-teyvat` de `demos/20-pixel`, et `deepseek-v41-flash` emprunte le langage visuel de `demos/19-paperclip` | MIT |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Vincentwei1021 | **Vocabulaire de plans** : 124 fiches de recettes de plan / 150 effets. Chercher « comment filmer ce temps fort » va plus vite que l'inventer | Apache-2.0 |
| [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | LemoLab | **59 styles de films faits en code.** La dépendance `playwright-core` de `pdoom` pointe ici ; le moteur plume-et-lavis de `the-fuse` en vient aussi ; les directions data-storytelling et iso-infographic ont inspiré le rendu | MIT |
| [huashu-motion](https://github.com/alchaincyf/huashu-motion) | Huashu | Le workflow complet d'un skill de film de lancement produit : écrire le script, composer la musique, éditer l'image dans le navigateur | MIT |
| [pdoom-video](https://github.com/mexicat/pdoom-video) | Giacomo Magnanini | **Le clip génératif de référence** : typographie synchronisée au mot, rendu déterministe. `pdoom/` en est une adaptation locale | MIT |
| [openfilm/examples](https://github.com/openfilm/examples) | OpenFilm | Projets minimaux que l'on peut ouvrir, modifier et rendre | MIT |

Également :

- **Polices** : LXGW Marker Gothic, Caveat, Long Cang, Fusion Pixel 12px, Press Start 2P — toutes sous SIL Open Font
  License 1.1 ; données d'ordre des traits CJK issues de
  [hanzi-writer-data](https://github.com/skishore/makemeahanzi) (LGPL-3.0 / Arphic).
- **Échantillons** : `lib/audio/samples/` est du matériel VCSL sous CC0 ; tous les autres timbres sont synthétisés en
  numpy, sans ressource tierce.
- **`pixel-teyvat`** : le sprite de Paimon et les éléments visuels liés à Teyvat sont la propriété de
  miHoYo / HoYoverse. Ce projet est une démonstration technique de fan, non commerciale.

L'attribution propre à chaque film se trouve dans le `CREDITS.md` de son dossier. L'index de la bibliothèque de
référence est dans `video_prototype/README.md`.
