# Model treści (content model) — Hotel Strzelec Wrocław

> Status: **do implementacji**
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md) (mechanizm kolekcji), [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) (Faza B.4 / F)
>
> Konkretny schemat treści wynikający z 15 podstron prototypu. To jest artefakt z kroku **B.4** (wydzielenie treści do danych) — staje się 1:1 kolekcjami w Astro (Zod) i konfiguracją pól w Sveltii.

---

## 1. Zasady

- **Singleton** = jeden obiekt na całą stronę (np. dane firmy, treść strony głównej). W Astro: plik danych / kolekcja jednoelementowa; w Sveltii: `file` collection.
- **Kolekcja** = wiele wpisów tego samego typu (np. pokoje, zdjęcia). W Astro: `glob` loader; w Sveltii: `folder` collection z `create: true`.
- Każde pole ma: typ (Zod), widget (Sveltia), wymagalność. Zdjęcia trzymamy w `public/img/...`, w danych zapisujemy ścieżkę.
- SEO (title/description/OG) jest polem **każdej strony**, nie osobnym bytem.

---

## 2. Mapa: podstrona prototypu → typ treści

| Podstrona | Typ treści |
|---|---|
| (wszystkie) header/stopka/kontakt | **Singleton: `settings`** (globalne) |
| `index.html` | **Singleton: `strona-glowna`** (sekcje hero/ścieżki/trust) |
| `pokoje.html`, `noclegi.html` | **Kolekcja: `pokoje`** + singleton opisu sekcji |
| `imprezy.html`, `wesela-i-bankiety.html`, `imprezy-plenerowe.html`, `catering.html`, `restauracja.html` | **Kolekcja: `oferta`** (typ = impreza/wesele/catering/…) |
| `galeria.html` | **Kolekcja: `galeria`** |
| `o-strzelcu.html` | **Singleton: `o-nas`** |
| `kontakt.html` | **Singleton: `kontakt`** (formularz + mapa; dane z `settings`) |
| `praca.html` | **Kolekcja: `oferty-pracy`** |
| `zastawa.html` | **Kolekcja: `zastawa`** (wypożyczalnia) + opis |
| menu restauracji (PDF) | **Singleton: `menu`** (plik PDF + ew. pozycje) |
| (brak w prototypie) | **Kolekcja: `aktualnosci`** (oferty specjalne — nowa) |

---

## 3. Singletony

### 3.1. `settings` — globalne dane obiektu
Kończy powielanie telefonów/adresu w 15 plikach (dług techniczny 2.2 z dok. CMS).

| Pole | Typ | Widget | Wymag. | Uwaga |
|---|---|---|---|---|
| `telefon1` | string | string | ✅ | format wyświetlany „733 123 621" |
| `telefon2` | string | string | – | |
| `email` | string | string | ✅ | |
| `adres` | string | string | ✅ | ul. Świątnicka 36, 52-018 Wrocław |
| `mapaUrl` | string | string | ✅ | link Google Maps |
| `godziny` | string | text | – | recepcja/restauracja |
| `facebook` | string | string | – | |
| `instagram` | string | string | – | |
| `tagline` | string | string | – | „noclegi · przyjęcia · dobra kuchnia" |

### 3.2. `strona-glowna`
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `heroTytul` | string | string | „Hotel Strzelec" |
| `heroPodtytul` | string | text | akapity hero |
| `heroCta` | list | list | etykieta + link (2–3 przyciski) |
| `sekcje` | list | list | „ścieżki"/„trust" — tytuł, tekst, zdjęcie, link |
| `seo` | object | object | title, description, ogImage |

### 3.3. `o-nas`, `kontakt`, `menu` — analogicznie
- `o-nas`: `tytul`, `body` (markdown), `zdjecia[]`, `seo`.
- `kontakt`: `naglowek`, `body`, `formularzId` (Formspree), `seo` (dane teleadresowe z `settings`).
- `menu`: `pdf` (plik), opcjonalnie `pozycje[]` (nazwa, opis, cena), `seo`.

---

## 4. Kolekcje

### 4.1. `pokoje`
Jeden plik = jeden typ pokoju.

| Pole | Typ | Widget | Wymag. | Uwaga |
|---|---|---|---|---|
| `nazwa` | string | string | ✅ | „Pokój 4-osobowy Comfort" |
| `standard` | enum(Classic, Comfort) | select | ✅ | |
| `osob` | number | number | ✅ | 2–5 |
| `cenaOd` | number | number | – | orientacyjna, zł/doba |
| `udogodnienia` | list<string> | list | – | Wi-Fi, TV, aneks… |
| `zdjecieGlowne` | string(path) | image | ✅ | |
| `galeria` | list<string> | list(image) | – | |
| `body` | markdown | markdown | – | opis |

Zod (do Astro):
```ts
const pokoje = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pokoje' }),
  schema: z.object({
    nazwa: z.string(),
    standard: z.enum(['Classic', 'Comfort']),
    osob: z.number(),
    cenaOd: z.number().optional(),
    udogodnienia: z.array(z.string()).default([]),
    zdjecieGlowne: z.string(),
    galeria: z.array(z.string()).default([]),
  }),
});
```

### 4.2. `oferta` (imprezy / wesela / catering / restauracja)
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `tytul` | string | string | |
| `typ` | enum(impreza, wesele, catering, restauracja, plener) | select | filtrowanie/routing |
| `zajawka` | string | text | |
| `zdjecieHero` | string(path) | image | |
| `punkty` | list<string> | list | lista usług/atutów |
| `body` | markdown | markdown | |
| `seo` | object | object | |

### 4.3. `galeria`
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `zdjecie` | string(path) | image | ✅ |
| `alt` | string | string | dostępność/SEO |
| `kategoria` | enum(pokoje, sala, restauracja, catering, plener, obiekt) | select | filtr galerii (jest w `main.js`) |

### 4.4. `oferty-pracy`
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `stanowisko` | string | string | |
| `wymiar` | string | string | pełny etat / zmianowy |
| `aktywne` | boolean | boolean | ukrywanie wygasłych |
| `body` | markdown | markdown | opis + wymagania |

### 4.5. `zastawa` (wypożyczalnia)
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `nazwa` | string | string | |
| `cena` | number | number | za sztukę/komplet |
| `zdjecie` | string(path) | image | |
| `dostepne` | boolean | boolean | |

### 4.6. `aktualnosci` (nowa — oferty specjalne)
| Pole | Typ | Widget | Uwaga |
|---|---|---|---|
| `tytul` | string | string | „Pakiet sylwestrowy" |
| `data` | date | datetime | |
| `zdjecie` | string(path) | image | |
| `body` | markdown | markdown | |
| `aktywne` | boolean | boolean | |

---

## 5. Media i nazewnictwo

- Zdjęcia: `public/img/<kategoria>/...` (zgodnie z obecną strukturą `assets/img/`).
- Sveltia `media_folder` per kolekcja (np. pokoje → `public/img/pokoje`).
- Format docelowy: **WebP/AVIF** (skrypt `optimize-images.js`); w danych trzymamy ścieżkę bazową, warianty generuje build.

---

## 6. Uwagi i decyzje otwarte

- **i18n (EN):** model przewiduje pola tekstowe „płaskie". Jeśli wejdzie wersja EN, Sveltia wspiera i18n — wtedy pola tekstowe stają się wielojęzyczne (nakład osobny, patrz plan sekcja 5).
- **Ceny pokoi:** `cenaOd` jest orientacyjna i redakcyjna; **twarde ceny/dostępność żyją w silniku rezerwacji** (Opcja A), nie w CMS. CMS pokazuje „od X zł", silnik sprzedaje.
- **SEO:** każda strona/singleton ma `seo` (title/description/ogImage) — zastępuje dziś zaszyte w HTML metatagi.
- **Zakres CMS (na start):** panel edycji obejmuje na start tylko **`pokoje`, `galeria`, `oferta`, `menu`**. Pozostałe kolekcje i singletony (`settings`, `strona-glowna`, `o-nas`, `kontakt`, `oferty-pracy`, `zastawa`, `aktualnosci`) są w pełni zdefiniowane i wydzielone jako dane (gotowe pod CMS), ale edytowane przez dev do czasu rozszerzenia panelu — koszt dołożenia później jest niski, bo dane są już ustrukturyzowane.
