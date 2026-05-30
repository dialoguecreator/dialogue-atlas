# Dialogue Atlas

Interna desktop aplikacija za dokumentaciju i brainstorming Dialogue agencije.
Spaja Notion-style hijerarhiju + rich editor + Miro-style canvas (flowchart /
mindmap) u jednoj macOS aplikaciji. Samo Daniel i Bojan koriste, sa
mogućnošću da delite SOP-ove sa timom kao view-only linkove.

---

## Šta sve može

- **Doc** — Notion-style stranice (blokovi, headings, tabele, slash menu).
- **Map** — Slab-style hijerarhija kartica (subkategorije, drag iz Finder-a, Add file).
- **Mindmap** — pun tldraw canvas (Miro stil): pen, oblici, sticky notes, strelice, layeri, undo/redo.
- **AI** — u Mindmap modu, "Generate with AI" pravi flowchart iz prompt-a (Anthropic API).
- **Fajlovi inline** — PDF (iframe), Excel/CSV (editabilna tabela), DOCX (Word → BlockNote sa "Edit inline"), slike.
- **Cmd+V** — paste screenshot ili fajl iz clipboard-a → upload u trenutnu kategoriju.
- **Drag & drop** — fajl iz Finder-a → bilo koja kartica → upload kao child.
- **Cloud sync** — Daniel i Bojan vide iste fajlove na oba Mac-a (Supabase).
- **Auto-update** — kad ti pošaljem novu verziju (.dmg), Bojanov app sam pita da li želi da instalira.
- **Dark / Light** mode toggle.

---

## Prvo pokretanje — Daniel (admin)

### 1) Napravi Supabase projekat

1. Idi na [supabase.com](https://supabase.com) i napravi novi projekat (free tier).
2. Sačekaj 1-2 minuta dok se inicijalizuje.
3. **SQL Editor** → **New query** → paste sledeće:

```sql
-- Glavna tabela za sve workspaces/topics/files
create table if not exists atlas_nodes (
  id text primary key,
  parent_id text,
  title text not null default 'Untitled',
  kind text not null default 'doc',
  icon text,
  sort_order bigint not null default 0,
  doc_content text,
  canvas_content text,
  view_mode text not null default 'doc',
  file_mime text,
  file_name text,
  file_data text,
  file_size bigint,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  owner uuid not null
);

create index if not exists atlas_nodes_updated on atlas_nodes(updated_at desc);

-- Whitelist članova workspace-a (samo Daniel + Bojan)
create table if not exists atlas_workspace_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Row-Level Security
alter table atlas_nodes enable row level security;
alter table atlas_workspace_members enable row level security;

create policy "Members read nodes" on atlas_nodes
  for select using (auth.uid() in (select user_id from atlas_workspace_members));

create policy "Members insert nodes" on atlas_nodes
  for insert with check (auth.uid() in (select user_id from atlas_workspace_members));

create policy "Members update nodes" on atlas_nodes
  for update using (auth.uid() in (select user_id from atlas_workspace_members));

create policy "Members read members" on atlas_workspace_members
  for select using (auth.uid() = user_id);
```

Klikni **Run**.

### 2) Dodaj naloge

1. **Authentication → Users → Add user → Create new user** za sebe (email + password).
2. Isto za Bojana.
3. **Authentication → Users** — kopiraj UUID za svaki nalog.
4. **SQL Editor** → paste (zameni UUID-ove):

```sql
insert into atlas_workspace_members (user_id) values
  ('TVOJ-UUID'),
  ('BOJANOV-UUID');
```

### 3) Dohvati URL i ključ

1. **Project Settings → API**
2. Kopiraj **Project URL** i **anon public** ključ (NE service role).
3. Otvori Dialogue Atlas → **Settings** (donji-levo) → **Sync** tab → **Set up sync** → zalepi URL i ključ → sign in.
4. Posle uspešnog sign in-a, app počinje da sinhronizuje. Sve što napraviš se push-uje u Supabase, sve što Bojan napravi se pull-uje k tebi (svakih 30 s, plus odmah posle svakog tvog edit-a).

### 4) Pošalji Bojanu

1. Pošalji mu **.dmg** fajl (AirDrop / Drive / email).
2. Pošalji mu Supabase **Project URL** i **anon public ključ** (taj ključ je javan, nije tajna).
3. Pošalji mu njegov **email i password** (taj jeste tajna — koristi 1Password ili sl.).
4. On instalira, otvara, ide u Settings → Sync, isti URL + ključ + njegov login. Posle par sekundi vidi sve tvoje fajlove.

---

## Prvo pokretanje — Bojan

1. Dobiješ `.dmg` od Daniela.
2. Dupli klik → drag ikonu u Applications.
3. **Prvi put** kad pokreneš: macOS će reći "unidentified developer". **Right-click** na ikonu Dialogue Atlas → **Open** → klikni **Open** opet u dialogu. Posle toga radi normalno duplim klikom.
4. Otvori Settings (donji-levo, zupčanik) → **Sync** tab → **Set up sync**.
5. Zalepi Project URL + anon ključ koje ti je Daniel poslao.
6. Sign in sa email/password.
7. Gotovo. Sve sinhronizuje automatski.

---

## Slanje update-a Bojanu (kad dodam nešto novo)

Auto-update radi preko **GitHub Releases**. Ti praviš release, Bojanov app proverava update svakih put kad ga otvori, dobija "Update available" pop-up dole desno → klik → install → restart.

### Jednokratan setup

1. Napravi javni GitHub repo: `Bumble-Dialogue/dialogue-atlas-releases` (ili promeni URL u `src-tauri/tauri.conf.json` na svoj).
2. To je to. Ne treba ti GitHub Actions ako buildaš lokalno.

### Svaki release — automatski preko skripte

```bash
cd "/Users/daniel/Desktop/Documentation APP/dialogue-atlas"

# 1) Bump verziju u package.json (npr. 0.1.0 → 0.2.0) i tauri.conf.json
# 2) Pokreni release skriptu
bash scripts/release.sh
```

Skripta automatski:
- Build-uje signed `.app.tar.gz` (updater artifact) + `.dmg` (za prvu instalaciju)
- Kopira sve u `~/Desktop/Dialogue Atlas - Release vX.Y.Z/`
- Generiše `latest.json` sa svežim signature-om

Onda na GitHub-u:

1. **Releases → Draft a new release** sa tagom `vX.Y.Z` (npr. `v0.2.0`).
2. Upload-uj **tri** fajla iz release foldera na Desktop-u:
   - `Dialogue Atlas.app.tar.gz`
   - `Dialogue Atlas.app.tar.gz.sig`
   - `latest.json`
3. (Opcionalno) `.dmg` ako ti treba za new-install (Bojan već ima app).
4. Klik **Publish release**.

Bojanov app će sledeći put kad ga otvori dobiti "Update available" popup → klik → instalira → restart.

> Ako Bojan ima Intel Mac (ne M-čip), generišeš `darwin-x86_64` arhitekturu zasebno: prebaci na njegov Mac/Intel VM, build, dodaj odgovarajuću sekciju u `latest.json`. Za sada pretpostavljam oboje imate M-čipove.

---

## Arhitektura — gde je šta

```
dialogue-atlas/
├── src/                              # React + TypeScript frontend
│   ├── types.ts                      # AtlasNode, ViewMode, ShareLink
│   ├── lib/
│   │   ├── db.ts                     # SQLite wrapper (Tauri SQL plugin)
│   │   ├── store.ts                  # Zustand store za nodes
│   │   ├── sync.ts                   # Supabase sync engine
│   │   ├── supabase.ts               # Supabase client factory
│   │   ├── theme.ts                  # Light/dark mode store
│   │   ├── files.ts                  # File → base64 helpers
│   │   ├── aiMindmap.ts              # Claude API za AI generisanje
│   │   ├── emojiSearch.ts            # Curated emoji baza
│   │   ├── usePasteFiles.ts          # Cmd+V handler
│   │   └── useExternalFileDrop.ts    # Finder drop helper
│   ├── components/
│   │   ├── TitleBar.tsx              # macOS title bar + sync status
│   │   ├── UpdateBanner.tsx          # "Update available" toast
│   │   ├── SettingsDialog.tsx        # Sync / AI / About
│   │   ├── ThemeToggle.tsx           # Bubble switch
│   │   ├── ErrorBoundary.tsx
│   │   ├── sidebar/                  # Tree, drag & drop
│   │   ├── workspace/                # Right pane container
│   │   ├── editor/Editor.tsx         # BlockNote wrapper
│   │   ├── canvas/                   # ContentMap (Map) + Canvas (Mindmap, tldraw) + AI dialog
│   │   ├── files/                    # PDF/CSV/XLSX/DOCX viewers
│   │   ├── share/                    # ShareDialog + Watermark
│   │   └── ui/                       # ConfirmDialog, EmojiPicker
│   ├── App.tsx                       # Auth → HomePage router
│   └── main.tsx                      # Entry + window-level drop guard
└── src-tauri/                        # Rust backend
    ├── src/lib.rs                    # Tauri builder + SQL migracije + plugins
    ├── Cargo.toml                    # opener, sql (sqlite), updater, process
    ├── capabilities/default.json     # Window permissions
    └── tauri.conf.json               # App metadata + updater config + pubkey
```

---

## Tehnička napomena za buduće mene/Claude-a

- **Updater signing key**: `/Users/daniel/.dialogue-atlas-keys/updater.key`. **Nikad ne commit-uj.** Bez njega ne možeš da praviš signed update-ove i Bojanov app će odbiti instalaciju.
- **prosemirror-model pinned na 1.25.4** preko npm `overrides` jer 1.25.5+ ima striktni renderSpec koji ruši BlockNote.
- **dragDropEnabled: false** u tauri.conf.json — bez toga Tauri presreće native drop pre nego što stigne do webview-a.
- **Sync algoritam**: push dirty rows + pull rows novije od `last_sync` timestamp-a. Conflict resolution: last-write-wins po `updated_at`. Dovoljno za 2 korisnika koji nisu često u istom dokumentu istovremeno.

---

## Pokretanje u dev modu (za razvoj)

```bash
cd "/Users/daniel/Desktop/Documentation APP/dialogue-atlas"
npm run tauri dev
```

Prvi build je dug (~10 min), posle ide HMR brzo.
