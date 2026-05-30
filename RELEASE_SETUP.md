# Auto-update setup (jednokratno)

Cilj: ti push-uješ tag → GitHub sam build-uje + signed release →
Bojanov app vidi "Update available" banner sledeći put kad ga otvori.

---

## Korak 1 — Napravi GitHub repo (5 min)

Ako već nemaš nalog: napravi besplatan na [github.com](https://github.com).

Onda na [github.com/new](https://github.com/new):
- **Repository name**: `dialogue-atlas` (ili šta hoćeš)
- **Public** — MORA biti public, jer Bojanov app proverava update manifest preko nezaštićenog URL-a. (Source code u repo-u je read-only za neulogovane — niko ne može ništa da menja, samo da čita. Ako brineš oko privatnosti SOP-ova: oni NIKAD nisu u GitHub repo-u, samo se nalaze u Supabase + lokalno na tvom Mac-u.)
- **NE** označi "Initialize with README".
- Klik **Create repository**.

Zapamti URL koji ti pokaže — npr. `https://github.com/danielsmth/dialogue-atlas.git`.

---

## Korak 2 — Prilagodi updater URL (1 min)

Otvori `src-tauri/tauri.conf.json` i pronađi:

```json
"endpoints": [
  "https://github.com/Bumble-Dialogue/dialogue-atlas-releases/releases/latest/download/latest.json"
]
```

Zameni `Bumble-Dialogue/dialogue-atlas-releases` sa tvojim `USER/REPO`. Na primer:

```json
"endpoints": [
  "https://github.com/danielsmth/dialogue-atlas/releases/latest/download/latest.json"
]
```

> Bitno: ovo se kompajluje u sam app. Trenutni instaliran v0.2.x app NE ZNA za novi URL.
> Posle ove izmene, build-uješ v0.3.0 i šalješ Bojanu manuelno (.dmg) jedan poslednji put.
> Tek od v0.3.0 nadalje, sve buduće verzije idu automatski.

---

## Korak 3 — Push source code na GitHub (5 min)

U Terminal-u:

```bash
cd "/Users/daniel/Desktop/Documentation APP/dialogue-atlas"

# Init git i pravi prvi commit
git init
git branch -M main
git add .
git commit -m "Initial commit"

# Poveži sa GitHub repo-om (zameni URL svojim)
git remote add origin https://github.com/TVOJ-USER/TVOJ-REPO.git
git push -u origin main
```

Ako traži login, koristi tvoju GitHub lozinku ILI **Personal Access Token** (sa
github.com/settings/tokens → Generate new token → daj `repo` privilegiju).

---

## Korak 4 — Dodaj 2 secrets (5 min) — kritično za auto-update

GitHub Actions mora da pristupi tvom signing key-u da bi mogao da potpiše update.
**Ali key NE SME da bude u repo-u** — koristimo Secrets za to.

1. Otvori tvoj repo na github.com
2. Klikni **Settings** (gore) → **Secrets and variables** → **Actions**
3. Klikni **New repository secret**, dodaj **dva** secret-a:

### Secret 1: `TAURI_SIGNING_PRIVATE_KEY`

U Terminal-u na tvom Mac-u:

```bash
cat ~/.dialogue-atlas-keys/updater.key
```

Kopiraj **ceo izlaz** (više linija) i nalepi kao **Value** za ovaj secret.

### Secret 2: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Value je samo **prazno polje** — naš key nema lozinku. Samo klikni "Add secret"
bez upisivanja.

---

## Korak 5 — Testiraj prvi auto-release (5 min)

```bash
cd "/Users/daniel/Desktop/Documentation APP/dialogue-atlas"

# Bumpuj verziju u OBA fajla:
# 1) package.json: "version": "0.3.0"
# 2) src-tauri/tauri.conf.json: "version": "0.3.0"

# Commit izmene
git add package.json src-tauri/tauri.conf.json
git commit -m "Release v0.3.0 — initial auto-update test"
git push

# Push tag — ovo aktivira GitHub Action
git tag v0.3.0
git push origin v0.3.0
```

Otvori repo na github.com → klik **Actions** tab. Videćeš da se "Build & Release"
workflow pokrenuo. Traje 5–10 min na GitHub-ovim runnerima.

Kad završi, idi na **Releases** tab — videćeš novu v0.3.0 sa fajlovima:
- `Dialogue_Atlas_0.3.0_aarch64.dmg`
- `Dialogue_Atlas.app.tar.gz`
- `Dialogue_Atlas.app.tar.gz.sig`
- `latest.json`

---

## Korak 6 — Daj Bojanu zadnji ručni install (jednokratno)

Pošto njegov v0.2.x app još ne zna za novi GitHub URL, pošalji mu **.dmg
v0.3.0** sa GitHub Releases-a (klik na fajl pa "Download").

Cmd+Q → drag .dmg → Replace → Open. Sad ima v0.3.0 koji zna za GitHub.

**Od ovog trenutka, sve buduće update-e dobija automatski.**

---

## Daljnji workflow — kad god promenim nešto u app-u

```bash
cd "/Users/daniel/Desktop/Documentation APP/dialogue-atlas"

# Napravi izmene u kodu (ja ti pomažem — Claude)
# Bumpuj verziju u package.json + tauri.conf.json (npr. 0.3.0 → 0.3.1)

# Commit + push + tag
git add .
git commit -m "Šta je novo u v0.3.1"
git push

git tag v0.3.1
git push origin v0.3.1
```

GitHub Action automatski:
1. Klonira repo
2. Build-uje signed app
3. Generiše `latest.json`
4. Pravi GitHub Release sa svim artifacts-ima

Bojanov app pri sledećem otvaranju vidi banner **"Update available — v0.3.1"** →
klik **Install & relaunch** → instaliran je posle 30s.

---

## Troubleshooting

### Workflow je pao
- Klik na pad u Actions tab → vidi log
- Najčešće: nedostaju secrets, ili tag ne počinje sa `v`
- Ako kažem da je signing problem, verifikuj da li je `TAURI_SIGNING_PRIVATE_KEY` ceo sadržaj key fajla (više linija)

### Bojan ne vidi banner
- Provari da li je njegov app v0.3.0+ (gde je novi GitHub URL kompajliran)
- Provari da li je GitHub Release "published" (ne draft)
- Provari da li `latest.json` postoji u Releases. Klikni na taj fajl u Releases-u — treba da otvori JSON sa version, signature, url

### Hoću da promenim release notes
- Edit commit message — to ide u "notes" polje latest.json-a (prvih 500 karaktera)
- Ili posle puštanja, edit Release na github.com → upiše proizvoljan tekst

---

## TL;DR — celokupan ciklus posle setup-a

```bash
# 1. Izmene
# 2. Bumpuj verzije u package.json + tauri.conf.json
git add . && git commit -m "What's new" && git push
git tag vX.Y.Z && git push origin vX.Y.Z
# 3. Sačekaj ~10 min, Bojanov app dobija update banner sam od sebe.
```
