# Dokumentacja techniczna — Astro i integracja z CMS

> Status: **referencja techniczna**
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`cms-i-migracja-design.md`](./cms-i-migracja-design.md) (Opcja 1), [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) (założenia stacku)
>
> Ten dokument wyjaśnia, **jak działa Astro** (rekomendowany stack) i **jak wpina się w niego CMS**. To materiał referencyjny/wdrożeniowy — nie dokument decyzyjny (te opisują *dlaczego* Astro; ten opisuje *jak*).

---

## 1. Model podstawowy: renderowanie w czasie builda

Astro to generator stron statycznych (SSG), który **raz, podczas builda**, wykonuje kod komponentów i **zapisuje gotowy statyczny HTML** do folderu `dist/`. Ten HTML wrzuca się na hosting jak obecny prototyp.

```
źródła (komponenty + dane)  ──[ astro build ]──►  dist/ (czysty HTML/CSS)  ──►  hosting
```

Różnica względem WordPressa: WP generuje stronę **przy każdym wejściu użytkownika** (PHP + baza, na żywo). Astro generuje ją **z góry** — użytkownik dostaje gotowy plik. Stąd szybkość i brak serwera aplikacyjnego do zaatakowania.

Astro domyślnie **nie wysyła JavaScriptu do przeglądarki** („zero JS by default”). JS ładuje się tylko tam, gdzie świadomie się go włączy (tzw. **wyspy / islands**) — np. galeria z lightboxem. Reszta strony to czysty HTML.

---

## 2. Struktura projektu

```
src/
├── pages/          ← ROUTING: każdy plik = jedna podstrona (URL)
│   ├── index.astro         → /
│   ├── kontakt.astro       → /kontakt
│   └── pokoje/[slug].astro → /pokoje/... (dynamiczne, opcjonalnie)
├── layouts/        ← szkielety stron (wspólny <head>, header, stopka)
│   └── Base.astro
├── components/     ← klocki wielokrotnego użytku
│   ├── Header.astro
│   ├── Footer.astro
│   └── Gallery.astro
├── content/        ← TREŚĆ jako dane (Markdown/JSON/YAML)
│   ├── pokoje/
│   └── config.ts   ← schemat treści (walidacja)
└── data/
    └── kontakt.json ← globalne dane (telefony, adres)
public/             ← pliki kopiowane 1:1 (obrazy, menu.pdf)
```

---

## 3. Anatomia komponentu `.astro`

Plik `.astro` ma dwie części oddzielone `---`:
- **frontmatter** (na górze, między `---`) — kod JS/TS wykonywany **na serwerze w czasie builda**;
- **szablon** (pod spodem) — HTML z wstawianiem danych przez `{ }`.

```astro
---
// kod build-time: importy, pobranie danych, logika
const telefon = "733 123 621";
---
<a href={`tel:+48${telefon.replaceAll(' ','')}`}>📞 {telefon}</a>
```

Zmienne (`{telefon}`) są wstawiane podczas builda — w wynikowym pliku jest już gotowy tekst.

---

## 4. Routing = pliki

Plik `src/pages/kontakt.astro` automatycznie staje się adresem `/kontakt`. To dzisiejszy model „jeden plik = jedna strona”, tylko z warstwą szablonów pod spodem.

---

## 5. Layouty i komponenty — koniec powielania headera

Rozwiązuje główny dług techniczny (header/stopka skopiowane w 15 plikach).

**Header raz, jako komponent** (`src/components/Header.astro`):
```astro
---
import kontakt from '../data/kontakt.json';
---
<header class="site-header">
  <a href="/"><img src="/img/logo-green.png" alt="Hotel Strzelec"></a>
  <nav>
    <a href="/">Start</a>
    <a href="/noclegi">Noclegi</a>
    <a href="/kontakt">Kontakt</a>
  </nav>
  <a href={`tel:+48${kontakt.telefon}`}>{kontakt.telefonWyswietlany}</a>
</header>
```

**Layout bazowy** (`src/layouts/Base.astro`) — `<slot />` to miejsce na treść konkretnej strony:
```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <meta name="description" content={description}>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <Header />
    <main><slot /></main>   <!-- ← tu wchodzi treść strony -->
    <Footer />
  </body>
</html>
```

**Strona używa layoutu** (`src/pages/kontakt.astro`):
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Kontakt | Hotel Strzelec" description="...">
  <h1>Kontakt</h1>
</Base>
```

Zmiana numeru telefonu = edycja jednego `kontakt.json`. Zmiana menu = edycja jednego `Header.astro`. Zamiast 15 plików.

---

## 6. Treść jako dane — Content Collections (rdzeń „gotowości pod CMS”)

To krok B.4 z planu wdrożenia i najważniejsza część pod CMS. Opisy pokoi itp. trzyma się jako **dane z określonym schematem**, nie w HTML.

**Definicja kolekcji + schemat** (`src/content/config.ts`) — Zod waliduje pola:
```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pokoje = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pokoje' }),
  schema: z.object({
    nazwa: z.string(),
    standard: z.enum(['Classic', 'Comfort']),
    osob: z.number(),
    cenaOd: z.number(),
    zdjecie: z.string(),
  }),
});

export const collections = { pokoje };
```

**Jeden pokój = jeden plik** (`src/content/pokoje/comfort-4os.md`):
```markdown
---
nazwa: "Pokój 4-osobowy Comfort"
standard: Comfort
osob: 4
cenaOd: 260
zdjecie: /img/pokoje/pokoj-4os.jpg
---
Przestronny pokój z aneksem kuchennym i łazienką. Idealny dla rodzin.
```

**Strona konsumuje dane** (`src/pages/noclegi.astro`):
```astro
---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';
const pokoje = await getCollection('pokoje');
---
<Base title="Noclegi | Hotel Strzelec" description="...">
  {pokoje.map((p) => (
    <article>
      <img src={p.data.zdjecie} alt={p.data.nazwa}>
      <h3>{p.data.nazwa}</h3>
      <p>{p.data.standard} · {p.data.osob} os. · od {p.data.cenaOd} zł</p>
    </article>
  ))}
</Base>
```

Dodanie pokoju = dodanie pliku `.md`. **Treść jest danymi, nie HTML-em** — dlatego CMS wpina się później trywialnie.

> Uwaga wersyjna: API Content Layer (`loader: glob(...)` w `src/content/config.ts`, bez pola `type`) obowiązuje od Astro 5. We wcześniejszych wersjach składnia kolekcji była inna.

---

## 7. Wynik builda

`astro build` → folder `dist/` z gotowymi `index.html`, `noclegi/index.html` itd. + skopiowane obrazy. Zwykłe pliki statyczne — hostowane za darmo (Cloudflare/Netlify Pages), jak dziś prototyp.

---

## 8. Integracja z CMS

Skoro treść to pliki w `src/content/` i `src/data/`, CMS jest **wygodnym edytorem tych plików**. Dwa modele:

### Model A — Git-based CMS (Decap / Sveltia) ⭐ rekomendowany

CMS to panel WWW edytujący te same pliki Markdown/JSON w repozytorium.

```
Właściciel w panelu CMS  →  zmienia opis pokoju
        │
        ▼
CMS zapisuje commit do Git  (edytuje src/content/pokoje/comfort-4os.md)
        │
        ▼
CI/CD wykrywa zmianę  →  uruchamia `astro build`
        │
        ▼
Nowy dist/ ląduje na hostingu  →  strona zaktualizowana (kilkadziesiąt sekund)
```

Konfiguracja opisuje pola **1:1 ze schematem z sekcji 6** (`admin/config.yml`):
```yaml
collections:
  - name: pokoje
    label: Pokoje
    folder: src/content/pokoje
    create: true
    fields:
      - { name: nazwa, label: Nazwa, widget: string }
      - { name: standard, label: Standard, widget: select, options: [Classic, Comfort] }
      - { name: osob, label: Liczba osób, widget: number }
      - { name: cenaOd, label: Cena od, widget: number }
      - { name: zdjecie, label: Zdjęcie, widget: image }
      - { name: body, label: Opis, widget: markdown }
```

Właściciel widzi formularz, klika zapisz — pod spodem robi się commit i przebudowa. Nie dotyka kodu ani szablonów. Zero bazy danych; historia zmian = historia Git.

#### Jak działa Git-based CMS pod spodem (Decap / Sveltia)

Decap i Sveltia to **CMS bez bazy danych i bez backendu** — cały CMS to **jedna aplikacja JS działająca w przeglądarce**, serwowana jako statyczny plik z Twojej strony (pod `/admin`). Treść to pliki w repo; CMS jest graficzną nakładką na ich edycję.

Mechanizm krok po kroku:
```
1. Właściciel wchodzi na hotel.pl/admin  (statyczna aplikacja CMS)
2. Loguje się (OAuth przez GitHub — patrz niżej)
3. CMS przez API GitHuba WCZYTUJE pliki treści z repo i pokazuje je jako formularze
4. Właściciel zmienia np. cenę pokoju i klika „Zapisz"
5. CMS przez API GitHuba ROBI COMMIT (edytuje src/content/pokoje/comfort-4os.md)
6. CI/CD wykrywa commit → `astro build` → deploy
7. Po ~kilkudziesięciu sekundach strona jest zaktualizowana
```

CMS rozmawia **bezpośrednio z API GitHuba z przeglądarki** — brak serwera pośredniczącego, bazy do utrzymania, backupu i łatania. Historia zmian = historia commitów (każdą edycję można cofnąć).

**Co dostaje właściciel:** listę wpisów (np. wszystkie pokoje) z dodawaniem/edycją/usuwaniem, formularze zamiast kodu, edytor rich text dla opisów, wgrywanie zdjęć przez przeglądarkę (lądują w repo, w `media_folder`), opcjonalny *editorial workflow* (wersje robocze / pull requesty do zatwierdzenia przed publikacją).

**Uwierzytelnianie — jedyny „trudniejszy" element.** Skoro CMS pisze do repo, ktoś musi się zalogować i autoryzować. Aktualne opcje (2026):

| Metoda | Jak działa | Dla kogo |
|---|---|---|
| **Sveltia CMS Authenticator** (Cloudflare Workers) | mały darmowy worker obsługuje OAuth GitHub | ⭐ produkcja, właściciel loguje się kontem GitHub |
| **Personal Access Token (PAT)** | wklejasz token GitHuba, bez OAuth | najprościej, gdy 1 użytkownik/dev |
| **Netlify OAuth** | hosting na Netlify daje logowanie „z pudełka" | zgodność wsteczna z Decap |

Dla hotelu (właściciel + ew. recepcja): **Sveltia + Authenticator na Cloudflare Workers** — darmowe, jednorazowa konfiguracja po naszej stronie.

**Decap vs Sveltia** — ten sam gatunek (git-based, w dużej mierze **ten sam format `config.yml`**), ale różny stan:

| | Decap CMS | **Sveltia CMS** ⭐ |
|---|---|---|
| Pochodzenie | dawny Netlify CMS | **następca** Decap, pełny rewrite |
| Rozwój | mocno spowolniony | aktywny, nowoczesny |
| UX / edytor | starszy | znacznie lepszy, szybszy |
| i18n (PL/EN) | słabsze | **pierwszoklasowe** (ważne przy wersji EN) |
| Mobile | słaby | wspierany |
| Uwierzytelnianie | problematyczne po zmianach Netlify | prostsze (własny Authenticator, PAT) |
| Zgodność | — | wysoka kompatybilność z konfiguracją Decap (łatwa migracja) |

**Rekomendacja: Sveltia** — drop-in następca Decap (podobny `config.yml`), z lepszym UX, uwierzytelnianiem i i18n. Decap traktujemy jako punkt odniesienia / dla starszych projektów.

### Model B — Headless CMS przez API (Sanity / Strapi)

Treść mieszka w chmurowym CMS-ie, a Astro **pobiera ją przez API w czasie builda**:
```astro
---
// zamiast getCollection — fetch z API CMS-a, wciąż build-time
const pokoje = await fetch('https://api.sanity.io/...').then(r => r.json());
---
```
Po edycji CMS wysyła **webhook** do hostingu → rebuild. Efekt identyczny (statyczny HTML), ale dochodzi zewnętrzny system i zależność. Dla tej strony zwykle nadmiarowe — stąd rekomendacja modelu A.

---

## 9. Podział warstw — dlaczego to jest „gotowe pod CMS”

| Warstwa | Rola | Kto edytuje |
|---|---|---|
| **Astro** (layout, komponenty) | wygląd i struktura | deweloper |
| **Treść** (`src/content`, `src/data`) | dane strony | **CMS / właściciel** |
| **CMS** (Decap) | panel edycji tych danych | dokłada się później |

Astro i CMS to **rozdzielne warstwy**. Komponentyzacja (sekcja 5) + wydzielenie treści do danych ze schematem (sekcja 6) tworzą „gniazdo”, w które CMS wpina się później bez ruszania szablonów. Stąd wniosek z planu: **przygotowanie pod CMS można wykonać w całości teraz, a wybór i wpięcie konkretnego CMS-a odłożyć.**

---

## 10. Źródła

- Astro — Content Collections: https://docs.astro.build/en/guides/content-collections/
- Astro — Content Loader (`glob`) reference: https://docs.astro.build/en/reference/content-loader-reference/
- Astro — routing: https://docs.astro.build/en/guides/routing/
- Decap CMS (Git-based): https://decapcms.org/
- Sveltia CMS: https://github.com/sveltia/sveltia-cms
