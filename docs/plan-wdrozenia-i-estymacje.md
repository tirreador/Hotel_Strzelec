# Plan wdrożenia — prototyp → produkcja (Astro + Git-based CMS + rezerwacje Opcja A)

> Status: **wycena do dyskusji** (metoda: spec-driven development / openspec)
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`roadmap.md`](./roadmap.md), [`content-model.md`](./content-model.md), [`cms-i-migracja-design.md`](./cms-i-migracja-design.md), [`system-rezerwacji-design.md`](./system-rezerwacji-design.md), [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md)
>
> **Zakres:** doprowadzenie obecnego statycznego prototypu do **pełnej wersji produkcyjnej** — z **Git-based CMS (Sveltia)** i **rezerwacjami/płatnościami (Opcja A: gotowy silnik + channel manager)**. Wszystkie kluczowe decyzje są podjęte (sekcja 2).
>
> **Metoda przyjęta: spec-driven development (openspec) + AI.** Estymaty wiodące to kolumna SDD (sekcja 4). Nakład bazowy (bez AI) zostaje jako punkt odniesienia. Ocena gotowości dokumentacji do SDD — sekcja 9.

---

## 1. Podejście: „najpierw gotowość pod CMS, potem wpięcie CMS"

Nawet mając wybrany CMS, budujemy w kolejności minimalizującej ryzyko. Fundamentem jest doprowadzenie strony do stanu **gotowego pod CMS**, na który dopiero nakładamy panel. Ten fundament to:

1. **Warstwa szablonów** — header/stopka/nawigacja/kontakt jako jeden komponent, a nie kopia w 15 plikach.
2. **Treść wydzielona z HTML do danych** — ustrukturyzowane pliki (Markdown + frontmatter / kolekcje).
3. **Strona produkcyjnie kompletna** — prawne, SEO, wydajność, hosting.

Wpięcie Sveltii jest **ostatnim, lekkim krokiem** (Faza F), bo schemat treści z Fazy B.4 staje się 1:1 konfiguracją kolekcji.

---

## 2. Założenia estymacji (decyzje podjęte)

| Założenie | Wartość |
|---|---|
| **Stack** | statyczny — **Astro** (SSG). Opis: [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md) |
| **CMS** | **Sveltia CMS** (Git-based, następca Decap). Hosting panelu 0 zł, auth przez Cloudflare Workers |
| **Zakres CMS (na start)** | edytowalne przez właściciela: **pokoje, galeria, oferta, menu**. Reszta treści jako dane w repo (dev-editable), do dołożenia w CMS taniej później |
| **Rezerwacje** | **Opcja A** — gotowy silnik + channel manager jako widget. **Finalista (Hotres/Beds24) wybrany przez klienta PRZED startem projektu** — spike rozstrzygnięty, M5 odblokowany |
| **Płatności** | bramka wbudowana w silnik (Przelewy24/Stripe) — bez własnej integracji kart |
| **Migracja URL** | nowa strona **zastępuje** obecną; **URL-e 1:1** → przekierowania to jedna globalna reguła, ryzyko SEO minimalne |
| **Analityka (C.5)** | **opcjonalna, poza rdzeniem** — rekomendowany lekki Plausible po starcie (patrz nota przy Fazie C) |
| **Hosting** | Cloudflare Pages / Netlify (darmowy tier), CI/CD z repo |
| **Design** | obecny `assets/css/style.css` reużyty ~1:1, bez redesignu |
| **Treści** | istnieją w prototypie — migracja, nie tworzenie od zera |
| **Treści prawne** | dostarcza klient/prawnik; my tylko integrujemy |
| **Metoda** | **spec-driven (openspec) + AI**: z elementu roadmapy → spec → AI generuje → człowiek weryfikuje |
| **Specyfikacje** | openspecy **inicjowane z istniejącej dokumentacji** (`content-model`, `astro-architektura`, `roadmap`, design): AI generuje szkic z docs → człowiek robi review + kryteria akceptacji + GrillMe dla ryzykownych. Wycenione jako osobna pozycja **S** (sekcja 4) |
| **Zespół** | 1 deweloper (mid) + asysta AI |
| **Jednostka** | osobodzień = ~8h; widełki (optymistyczny–realistyczny) |

**Poza zakresem:** redesign, nowe zdjęcia/treści, pisanie regulaminu/polityk.

---

## 3. Kroki i estymacja (inwentarz nakładu — bazowo, bez AI)

> Tabele to pełny inwentarz pracy z nakładem **bazowym** (bez AI) — punkt odniesienia. Estymaty przyjęte (SDD + AI) — sekcja 4.

### Faza A — Fundament

| # | Krok | Osobodni |
|---|---|---|
| A.1 | Repo produkcyjne, hosting, domena robocza, HTTPS | 0,5 |
| A.2 | Setup Astro + pipeline CI/CD (auto-deploy) | 0,5–1 |
| **Suma** | | **1–1,5** |

### Faza B — Komponentyzacja + wydzielenie treści

| # | Krok | Osobodni |
|---|---|---|
| B.1 | Layout bazowy + komponenty: header, stopka, nav, mobile bar | 1–2 |
| B.2 | Globalny obiekt „dane firmy/kontakt" | 0,5 |
| B.3 | Migracja 15 podstron do szablonów Astro | 3–5 |
| B.4 | Wydzielenie treści do danych + schemat (Zod) — **zakres CMS: pokoje/galeria/oferta/menu** | 1–2 |
| B.5 | Inline-style → CSS; uporządkowanie | 1 |
| B.6 | Port `main.js` (galeria/lightbox/hamburger) | 0,5 |
| **Suma** | | **7–11** |

### Faza C — Produkcyjne must-have

| # | Krok | Osobodni |
|---|---|---|
| C.1 | Strony prawne (RODO, regulamin, cookies) — treść od klienta | 0,5–1 |
| C.2 | Baner zgody cookies | 0,5–1 |
| C.3 | Formularz kontaktowy (Formspree) + walidacja + RODO + anty-spam | 0,5–1 |
| C.4 | SEO techniczne: sitemap, robots, canonical, schema.org `LodgingBusiness` | 1–1,5 |
| C.6 | Wydajność: WebP (Astro Image), preload fontów, width/height | 1 |
| **Suma (rdzeń)** | | **3,5–5,5** |
| C.5 | *(opcjonalne, poza rdzeniem)* Analityka: Plausible/GA4 + Search Console | +0,5 |

> **Nota do C.5:** klient uznał analitykę za nie-niezbędną, więc jest poza rdzeniem. **Rekomendacja mimo to:** ~2–3 h na lekki Plausible daje pomiar konwersji rezerwacji bezpośrednich (wprost cel biznesowy 0% prowizji) — warto dołożyć po starcie. GBP (wizytówka Google) to zadanie marketingowe klienta, nie dev.

### Faza D — Go-live (zastąpienie obecnej strony)

| # | Krok | Osobodni |
|---|---|---|
| D.1 | **URL 1:1** → jedna globalna reguła przekierowań (np. `.html` → `/`) + potwierdzenie zgodności adresów | 0,25 |
| D.2 | Przełączenie domeny, DNS, weryfikacja HTTPS | 0,5 |
| D.3 | QA końcowe (a11y, mobile, linki, formularze) | 1–1,5 |
| D.4 | Monitoring, Search Console submit, bufor na poprawki | 0,5 |
| **Suma** | | **2,25–2,75** |

> Zastępujemy istniejącą stronę przy zachowaniu adresów 1:1 — brak ręcznego mapowania URL i minimalne ryzyko SEO.

### Faza E — Rezerwacje + płatności (Opcja A) — tor równoległy

Finalista wybrany przez klienta **przed startem** — bez etapu wyboru/spike'a. Praca głównie konfiguracyjna.

| # | Krok | Osobodni |
|---|---|---|
| E.1 | Założenie konta u **wybranego** dostawcy + konfiguracja obiektu (polityki, regulamin) | 0,5–1 |
| E.2 | Mapowanie typów pokoi (Classic/Comfort × 2–5 os.) + ceny/sezony/restrykcje | 1–2 |
| E.3 | Channel manager: Booking+Agoda+portale PL + testy synchronizacji (anty-overbooking) | 1–2 |
| E.4 | Bramka (Przelewy24) + model zaliczki + testy transakcji | 0,5–1 |
| E.5 | Osadzenie i stylizacja widgetu na `/rezerwacja` | 0,5–1 |
| E.6 | Testy end-to-end + szkolenie recepcji | 0,5–1 |
| **Suma** | | **4–8** |

> **Lead-time:** decyzja o dostawcy jest już podjęta, więc odpada; pozostaje **zatwierdzenie połączeń OTA** (Booking.com — kilka dni kalendarzowych). Uruchomić konto od razu na starcie.

### Faza F — Wpięcie CMS (Sveltia)

| # | Krok | Osobodni |
|---|---|---|
| F.1 | Sveltia + `config.yml` (kolekcje: pokoje/galeria/oferta/menu) | 0,5–1 |
| F.2 | Uwierzytelnianie (Authenticator na Cloudflare Workers / OAuth GitHub) | 0,5–1 |
| F.3 | Media (upload zdjęć) + opcjonalny editorial workflow | 0,5–1 |
| F.4 | Testy edycji end-to-end + instrukcja i szkolenie właściciela | 0,5–1 |
| **Suma** | | **2–4** |

---

## 4. Podsumowanie estymacji (metoda przyjęta: SDD + AI)

Założenia z sekcji 2 (URL 1:1, CMS = 4 obszary, finalista wybrany przed startem, C.5 poza rdzeniem) są **wliczone**. Poniżej estymaty dla dwóch profili wykonawcy, przy zastosowaniu **technik wykonania (grupa C)** — patrz [`sdd-optymalizacje.md`](./sdd-optymalizacje.md).

| Faza | Nakład bazowy | **Mid** (SDD+AI+C) | **Senior** (SDD+AI+C) |
|---|---|---|---|
| A. Fundament | 1–1,5 | 0,5–1 | 0,5–0,75 |
| B. Komponentyzacja + treść | 7–11 | **3–4,5** | **2–3,5** |
| C. Must-have (rdzeń) | 3,5–5,5 | 1,5–2,5 | 1–2 |
| D. Go-live (URL 1:1) | 2,25–2,75 | 1,25–2 | 1–1,5 |
| E. Rezerwacje + płatności | 4–8 | 3,5–6,5 | 3–5,5 |
| F. Wpięcie CMS (Sveltia) | 2–4 | 1,25–2,5 | 1–1,75 |
| **S. Generacja speców z dokumentacji** | — | **0,5–1,5** | **0,4–1** |
| **RAZEM (A–F + S)** | ~20–33 | **~11,5–20** | **~9–16 osobodni** |
| C.5 analityka (opcjonalnie) | +0,5 | +0,25 | +0,25 |

- **Pozycja S** to koszt zamiany dokumentów na ~20 openspeców: AI generuje szkic z `content-model`/`roadmap`/design, człowiek robi review, dopisuje kryteria akceptacji (z DoD) i przepuszcza ryzykowne przez GrillMe. Bez istniejącej dokumentacji ta pozycja byłaby wielokrotnie większa (spec-authoring od zera) — docs ją **redukują**, ale nie do zera.
- **Surowe SDD+AI** (bez pełnej grupy C) to ~11,5–20,5 (sekcja 8). **Grupa C zawęża górną granicę** (mniej reworku i ręcznego QA); **pozycja S** dokłada jawny koszt inicjalizacji speców → Mid ~11,5–20.
- **Różnica mid↔senior** koncentruje się w B/C/D/F (osąd, jakość specu, automatyzacja). **Faza E niemal się nie zmienia** — panele SaaS + lead-time OTA są niezależne od doświadczenia.
- Estymata **zawiera koszt pisania specyfikacji**, w dużej części „przedpłacony" dokumentami (`content-model.md`, `astro-architektura-i-cms.md`, design). Patrz sekcja 9.
- **Czas kalendarzowy** rządzi się lead-time'em połączeń OTA i treści prawnych, nie tylko osobodniami (sekcja 8.4).
- **Rezerwacje (Faza E) są stałą częścią zakresu** — nie rozważamy wariantu bez online-bookingu.

---

## 5. Świadomie poza zakresem

| Etap | Uwaga |
|---|---|
| Redesign / nowe zdjęcia / nowe treści | osobny zakres |
| Pisanie regulaminu i polityk (RODO/cookies) | po stronie klienta/prawnika; my integrujemy (C.1) |
| Wersja językowa EN | Sveltia wspiera i18n; tłumaczenia + szablony to osobny nakład |
| Analityka (C.5) | poza rdzeniem — rekomendowana po starcie (lekki Plausible) |

---

## 6. Ryzyka wpływające na estymację

| Ryzyko | Wpływ |
|---|---|
| Opóźnienie treści prawnych od klienta | blokuje C.1 i go-live (nie blokuje prac dev A–B) |
| Lead-time zatwierdzenia połączeń OTA | blokuje domknięcie Fazy E (uruchomić konto na starcie) |
| Migracja SEO | **zminimalizowane** dzięki URL 1:1 — pozostaje weryfikacja jednej reguły |
| Konieczność redesignu/nowych zdjęć | poza wyceną — osobny zakres |
| Nietypowe pakiety (wesele+nocleg, grupy) niemieszczące się w gotowym silniku | wymusza własny silnik (Opcja B) — istotnie większy nakład |

---

## 7. Rekomendowana kolejność

1. **Fazy A–B** — fundament + komponentyzacja + wydzielenie treści.
2. **Faza E (rezerwacje) — tor równoległy**: konto u wybranego dostawcy uruchomić od razu (lead-time OTA); konfigurację prowadzić obok B–C.
3. **Faza C** — must-have; treści prawne zamówić u klienta wcześnie.
4. **Faza F** — wpięcie Sveltii po ustabilizowaniu szablonów i danych.
5. **Faza D (go-live)** — po komplecie C, E i F.

---

## 8. Podstawa kompresji SDD + AI (uzasadnienie estymat z sekcji 4)

Metoda to **spec-driven + AI**. Poniżej dlaczego kolumna SDD wygląda tak — i gdzie kompresja NIE działa.

### 8.1. Gdzie AI przyspiesza, a gdzie nie

| Charakter pracy | Przykłady | Podatność na AI |
|---|---|---|
| Mechaniczna transformacja kodu | B.1–B.6, C.4, C.2/C.3 | 🟢 wysoka |
| Konfiguracja narzędzi | A.2, F.1–F.3 | 🟡 średnia |
| Konfiguracja zewnętrznych SaaS | E.1–E.4 | 🔴 niska |
| Testy / QA / weryfikacja | D.3, E.6, F.4 | 🟡 średnia |
| Lead-time i treści zewnętrzne | OTA, treści prawne | ⚫ zero |

### 8.2. Synergia: dokumenty designowe SĄ specyfikacją
Spec-driven wymaga zwykle inwestycji w spec. Tu jest ona w dużej części wykonana — dokumenty w `docs/` pełnią rolę specyfikacji. Koszt „pisania specu" jest zamortyzowany, a AI ma z czego generować.

### 8.3. Skorygowane estymaty (podsumowanie w sekcji 4)
Kompresja mocna w B/C/F (kod), słaba w D/E (konfiguracja/lead-time). Wynik: nakład dev **~20–33 → ~11,5–20,5 osobodni** (~35–40% mniej), skoncentrowany w Fazie B.

### 8.4. Czego AI/spec-driven NIE zmienia
- **Lead-time governuje kalendarz** (zatwierdzenie OTA, treści prawne).
- **Weryfikacja pozostaje ludzka** — płatności i anty-overbooking nie „na wiarę".
- **Jakość specu = jakość wyniku** — tu mamy dobrą bazę w `docs/`.
- **Faza E prawie się nie kurczy** — panele SaaS, nie kod.

### 8.5. Wniosek
Nakład dev spada z ~20–33 do **~11,5–20,5 osobodni**. Czas kalendarzowy skraca się mniej (lead-time OTA + weryfikacja). Największy zysk AI: **Faza B**.

---

## 9. Gotowość dokumentacji do SDD

### 9.1. Co jest gotowe

| Warstwa speca | Pokrycie | Ocena |
|---|---|---|
| „Co" (model danych) | `content-model.md` | 🟢 bardzo dobre |
| „Jak" (mechanizm) | `astro-architektura-i-cms.md` | 🟢 dobre |
| „Dlaczego" (decyzje) | design-doci + log w README | 🟢 dobre |
| Podział na spec-chunki | `roadmap.md` (nazwy openspeców) | 🟢 dobre |

### 9.2. Luki do domknięcia

| Luka | Wpływ | Jak domknąć |
|---|---|---|
| Kryteria akceptacji per element (DoD jest per kamień) | każdy openspec potrzebuje własnych AC | rozpisać AC z DoD roadmapy |
| Niefunkcjonalne niezmierzone (LCP/CLS, WCAG, pola schema.org) | specy C.4/C.6/D nieostre | dodać progi |
| Mapa 301 | trywialne dzięki **URL 1:1** — jedna reguła | potwierdzić format URL Astro |
| Inwentarz CSS→komponenty | spec komponentyzacji mniej precyzyjny | audyt CSS przy M1 |
| Treści prawne od klienta | spec `strony-prawne` niepełny | zamówić wcześnie |

> **Spike „Hotres vs Beds24" — rozstrzygnięty (decyzja klienta przed startem).** M5/Faza E jest **odblokowana**: kontrakt osadzenia widgetu i bramki znany od początku.

### 9.3. Werdykt
**Dokumentacja pozwala na łatwy SDD.** Specy „danych/szablonów" (M1, M2, M4) gotowe do wygenerowania od zaraz. Specy M3/D wymagają dopisania mierzalnych kryteriów (progi wydajności, WCAG, schema, reguła 301) — koszt ten jest **ujęty w pozycji S** (§4: generacja speców z dokumentacji, mid 0,5–1,5 / senior 0,4–1). Faza E już odblokowana dzięki decyzji przed startem.
