# Dokumentacja — Hotel Strzelec Wrocław

Analiza i plan doprowadzenia strony z prototypu (statyczny HTML) do wersji produkcyjnej z rezerwacjami, płatnościami i CMS.

## Spis dokumentów

| Dokument | Gatunek | O czym |
|---|---|---|
| [`system-rezerwacji-design.md`](./system-rezerwacji-design.md) | decyzyjny | Rezerwacje i płatności: problem synchronizacji z OTA (Booking/Agoda), rola channel managera, opcje (gotowy silnik vs własny vs iCal), bramki płatności PL. **Załącznik A**: szczegółowe porównanie systemów (Hotres/Beds24/Sirvoy/Cloudbeds/Profitroom) |
| [`cms-i-migracja-design.md`](./cms-i-migracja-design.md) | decyzyjny | Przejście prototyp → produkcja z CMS: diagnoza stanu, braki produkcyjne (RODO/SEO/wydajność), opcje CMS (SSG+Git CMS vs headless vs WordPress) |
| [`content-model.md`](./content-model.md) | referencyjny | Konkretny model treści (kolekcje + pola) wynikający z 15 podstron — pod implementację (krok B.4/F) |
| [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) | planistyczny | Kroki i wycena (osobodni) pełnego wdrożenia: Astro + Sveltia CMS + rezerwacje Opcja A. Zawiera scenariusz **AI/spec-driven** |
| [`roadmap.md`](./roadmap.md) | wykonawczy | Kamienie milowe (M0–M6) z DoD i kandydatami na openspecy/zadania; ścieżka krytyczna i tory równoległe. Baza do tworzenia zadań |
| [`sdd-optymalizacje.md`](./sdd-optymalizacje.md) | referencyjny | Techniki wykonania SDD+AI (grupa C) — złoty przykład, AC jako testy, równoległość itd. + estymaty mid vs senior |
| [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md) | referencyjny | Jak działa Astro i Git-based CMS (Decap/Sveltia) — opis techniczny z przykładami |

## Od czego zacząć

1. **Zrozumienie problemu i opcji** → dokumenty decyzyjne (`system-rezerwacji-design.md`, `cms-i-migracja-design.md`).
2. **Wycena i kolejność prac** → `plan-wdrozenia-i-estymacje.md`.
3. **Realizacja / tworzenie zadań** → `roadmap.md` (kamienie milowe → openspecy).
4. **Szczegóły techniczne i model treści** → `astro-architektura-i-cms.md`, `content-model.md`.

## Podjęte decyzje (log)

| Obszar | Decyzja | Gdzie uzasadnienie |
|---|---|---|
| **Stack** | statyczny — **Astro** (SSG) | `cms-i-migracja-design.md` Opcja 1 |
| **CMS** | **Sveltia** (Git-based, następca Decap), hosting panelu 0 zł, auth przez Cloudflare Workers | `astro-architektura-i-cms.md` §8 |
| **Rezerwacje** | **Opcja A** — gotowy silnik + channel manager jako widget | `system-rezerwacji-design.md` §4, Załącznik A |
| **Silnik** | finaliści **Hotres.pl** / **Beds24**; **wybór dokonywany przez klienta przed startem projektu** (spike rozstrzygnięty) | `system-rezerwacji-design.md` §A.8 |
| **Bramka płatności** | **Przelewy24** (BLIK), model: zaliczka 20–30% | `system-rezerwacji-design.md` §5.9 |
| **Zakres CMS (na start)** | edytowalne: pokoje, galeria, oferta, menu; reszta dev-editable | `content-model.md` §6 |
| **Migracja URL** | **1:1** — nowa strona zastępuje obecną, przekierowania = jedna reguła | `cms-i-migracja-design.md` §3 |
| **Analityka** | opcjonalna, poza rdzeniem (rekomendowany Plausible po starcie) | plan §C |
| **Hosting** | Cloudflare Pages / Netlify (darmowy tier) | plan §2 |

**Otwarte pytania:** wersja EN (i18n) tak/nie; model płatności OTA („Payments by Booking" vs własne obciążanie VCC).

## Zbiorczy koszt (TCO)

**Jednorazowo (wdrożenie):**
- Scenariusz bazowy (bez AI): **~20–33 osobodni**
- SDD + AI + techniki + generacja speców z docs — **mid: ~11,5–20** / **senior: ~9–16 osobodni**
- (× stawka dzienna zespołu = koszt jednorazowy; techniki: `sdd-optymalizacje.md`)

**Miesięcznie (utrzymanie):**

| Pozycja | Koszt |
|---|---|
| Hosting (Cloudflare/Netlify Pages) | **0 zł** |
| CMS (Sveltia) | **0 zł** |
| Silnik + channel manager | Hotres ~150–350 zł/mc **lub** Beds24 ~300–370 zł/mc |
| Bramka (Przelewy24) | 0 zł stałych, **~1,2–1,5% od transakcji** |
| Domena | ~50–150 zł/rok |
| Formularz (Formspree) | 0 zł (darmowy tier) lub kilka $/mc |
| **Razem stałe** | **~150–370 zł/mc + prowizje od płatności** |

Uwaga: prowizje OTA (Booking.com ~15%, „Payments by Booking" +~3% VCC) są niezależne od stacku — realna oszczędność wynika z przeciągania gości na rezerwację bezpośrednią (0% prowizji).

## Rekomendacja skrótowo

- Rezerwacje/płatności → **kupić/zintegrować** (gotowy silnik + channel manager + bramka PL), nie budować od zera.
- CMS → **lekki stack statyczny** (Astro + Sveltia), zachowujący obecny szybki front.
- Kolejność → najpierw **produkcja gotowa pod CMS** (komponentyzacja + wydzielenie treści + must-have), potem wpięcie Sveltii; tor rezerwacji równolegle.
