# Plan wdrożenia — prototyp → produkcja (Astro + Git-based CMS + rezerwacje Opcja A)

> Status: **wycena do dyskusji** (metoda: spec-driven development / openspec)
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`roadmap.md`](./roadmap.md), [`content-model.md`](./content-model.md), [`cms-i-migracja-design.md`](./cms-i-migracja-design.md), [`system-rezerwacji-design.md`](./system-rezerwacji-design.md), [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md)
>
> **Zakres:** doprowadzenie obecnego statycznego prototypu do **pełnej wersji produkcyjnej** — z **Git-based CMS (Sveltia)** i **rezerwacjami/płatnościami (Opcja A: gotowy silnik + channel manager)**. Wszystkie kluczowe decyzje technologiczne są już podjęte (sekcja 2).
>
> **Metoda przyjęta: spec-driven development (openspec) + AI.** Estymaty wiodące to kolumna SDD (sekcja 4). Nakład bazowy (bez AI) zostaje jako punkt odniesienia. Ocena gotowości dokumentacji do SDD — sekcja 9.

---

## 1. Podejście: „najpierw gotowość pod CMS, potem wpięcie CMS"

Nawet mając wybrany CMS, budujemy w kolejności, która minimalizuje ryzyko. Fundamentem jest doprowadzenie strony do stanu **gotowego pod CMS**, na który dopiero nakładamy panel. Ten fundament to trzy rzeczy:

1. **Warstwa szablonów** — header/stopka/nawigacja/kontakt jako jeden komponent, a nie kopia w 15 plikach.
2. **Treść wydzielona z HTML do danych** — teksty, pokoje, galeria, dane kontaktowe, menu jako **ustrukturyzowane pliki** (Markdown + frontmatter / YAML / kolekcje). To sedno „CMS-readiness": CMS później tylko edytuje te dane, bez ruszania szablonów.
3. **Strona produkcyjnie kompletna** — prawne, SEO, wydajność, hosting.

Wpięcie samego CMS (Sveltia) jest **ostatnim, lekkim krokiem** (Faza F), bo schemat treści z Fazy B.4 staje się 1:1 konfiguracją kolekcji w CMS.

---

## 2. Założenia estymacji (decyzje podjęte)

| Założenie | Wartość |
|---|---|
| **Stack** | statyczny — **Astro** (SSG). Opis: [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md) |
| **CMS** | **Sveltia CMS** (Git-based, następca Decap) — wybrany. Hosting panelu za darmo, auth przez Cloudflare Workers |
| **Rezerwacje** | **Opcja A** — gotowy silnik + channel manager jako **widget** (finaliści: Hotres.pl / Beds24). Bez budowy własnego silnika |
| **Płatności** | bramka wbudowana w silnik (Przelewy24/Stripe) — bez własnej integracji kart |
| **Hosting** | Cloudflare Pages / Netlify (darmowy tier), CI/CD z repo |
| **Design** | obecny `assets/css/style.css` reużyty ~1:1, bez redesignu |
| **Treści** | istnieją w prototypie — migracja, nie tworzenie od zera |
| **Treści prawne** | dostarcza klient/prawnik; my tylko integrujemy (nie wliczamy pisania regulaminu/polityk) |
| **Metoda** | **spec-driven (openspec) + AI**: z każdego elementu roadmapy powstaje spec → AI generuje kod → człowiek weryfikuje i iteruje |
| **Zespół** | 1 deweloper (mid) + asysta AI |
| **Jednostka** | osobodzień = ~8h; podane widełki (optymistyczny–realistyczny) |

**Poza zakresem tej wyceny:** redesign, tworzenie nowych treści/zdjęć, pisanie regulaminu/polityk (treść prawną dostarcza klient).

---

## 3. Kroki i estymacja (inwentarz nakładu — bazowo, bez AI)

> Poniższe tabele to **pełny inwentarz pracy** z nakładem bazowym (bez AI) — punkt odniesienia i „sufit". Estymaty przyjęte (SDD + AI) — sekcja 4.

### Faza A — Fundament

| # | Krok | Osobodni |
|---|---|---|
| A.1 | Repo produkcyjne, hosting, domena robocza, HTTPS | 0,5 |
| A.2 | Setup Astro + pipeline CI/CD (auto-deploy) | 0,5–1 |
| **Suma** | | **1–1,5** |

### Faza B — Komponentyzacja + wydzielenie treści (rdzeń „gotowości pod CMS")

| # | Krok | Osobodni |
|---|---|---|
| B.1 | Layout bazowy + komponenty: header, stopka, nav, mobile bar | 1–2 |
| B.2 | Globalny obiekt „dane firmy/kontakt" (koniec powielania telefonów/adresu) | 0,5 |
| B.3 | Migracja 15 podstron do szablonów Astro | 3–5 |
| B.4 | **Wydzielenie treści do ustrukturyzowanych danych** (teksty stron, pokoje, galeria, oferty, menu) + zdefiniowanie schematu treści (Zod) | 1,5–2,5 |
| B.5 | Wyniesienie inline-styli do CSS, uporządkowanie | 1 |
| B.6 | Przeniesienie logiki `main.js` (galeria/lightbox/hamburger) | 0,5 |
| **Suma** | | **7,5–11,5** |

> Krok B.4 to realna różnica między „stroną statyczną" a „stroną gotową pod CMS". Schemat treści zdefiniowany tutaj staje się 1:1 konfiguracją kolekcji w Sveltii (Faza F).

### Faza C — Produkcyjne must-have

| # | Krok | Osobodni |
|---|---|---|
| C.1 | Integracja stron prawnych (RODO, regulamin, cookies) — treść od klienta | 0,5–1 |
| C.2 | Baner zgody cookies | 0,5–1 |
| C.3 | Formularz kontaktowy (Formspree) + walidacja + zgoda RODO + anty-spam | 0,5–1 |
| C.4 | SEO techniczne: sitemap.xml, robots.txt, canonical, schema.org `LodgingBusiness` | 1–1,5 |
| C.5 | Analityka: GA4/Plausible + Search Console + Google Business Profile | 0,5 |
| C.6 | Wydajność: WebP/AVIF (istniejący `optimize-images.js`), preload fontów, width/height | 1 |
| **Suma** | | **4–6** |

### Faza D — Go-live

| # | Krok | Osobodni |
|---|---|---|
| D.1 | Mapa starych URL → nowych + przekierowania 301 | 0,5–1 |
| D.2 | Przełączenie domeny, DNS, weryfikacja HTTPS | 0,5 |
| D.3 | QA końcowe (a11y, mobile, linki, formularze) | 1–1,5 |
| D.4 | Monitoring, Search Console submit, bufor na poprawki | 0,5 |
| **Suma** | | **2,5–3,5** |

### Faza E — Rezerwacje + płatności (Opcja A: gotowy silnik + channel manager)

Osobny, **równoległy** tor. Praca w większości **konfiguracyjna**, nie programistyczna.

| # | Krok | Osobodni |
|---|---|---|
| E.1 | Wybór finalisty, założenie konta, konfiguracja obiektu (dane, polityki anulacji, regulamin) | 0,5–1 |
| E.2 | Mapowanie typów pokoi (Classic/Comfort × 2/3/4/5 os.) + ceny/sezony/restrykcje w silniku | 1–2 |
| E.3 | Konfiguracja channel managera: Booking.com + Agoda + portale PL, mapowanie, **testy synchronizacji (anty-overbooking)** | 1–2 |
| E.4 | Konfiguracja bramki płatności (Przelewy24/Stripe) + model zaliczki/przedpłaty + testy transakcji | 0,5–1 |
| E.5 | Osadzenie widgetu na podstronie „Rezerwacja" + stylizacja pod design strony | 0,5–1 |
| E.6 | Testy end-to-end (rezerwacja → płatność → panel → zdjęcie dostępności z OTA) + szkolenie recepcji | 0,5–1 |
| **Suma** | | **4–8** |

> **Lead-time (poza pracą dev):** akceptacja konta u dostawcy i **zatwierdzenie połączeń OTA** (Booking.com) potrafią trwać kilka dni kalendarzowych — nie blokują innych faz, ale trzeba uruchomić je wcześnie. Wybór finalisty i model płatności to decyzje klienta.

### Faza F — Wpięcie CMS (Sveltia)

Lekka faza dzięki gotowości z Fazy B. Głównie konfiguracja.

| # | Krok | Osobodni |
|---|---|---|
| F.1 | Instalacja Sveltia + `config.yml` (kolekcje 1:1 ze schematem z B.4) | 1–1,5 |
| F.2 | Uwierzytelnianie (Sveltia Authenticator na Cloudflare Workers / OAuth GitHub) | 0,5–1 |
| F.3 | Konfiguracja media (upload zdjęć) + opcjonalny editorial workflow | 0,5–1 |
| F.4 | Testy edycji end-to-end + instrukcja i szkolenie właściciela | 0,5–1 |
| **Suma** | | **2,5–4,5** |

---

## 4. Podsumowanie estymacji (metoda przyjęta: SDD + AI)

Wiodąca jest kolumna **SDD + AI**; nakład bazowy zostawiamy jako punkt odniesienia. Podstawa kompresji per faza — sekcja 8.

| Faza | Nakład bazowy | **SDD + AI (przyjęty)** |
|---|---|---|
| A. Fundament | 1–1,5 | 0,5–1 |
| B. Komponentyzacja + wydzielenie treści | 7,5–11,5 | **3,5–5,5** |
| C. Must-have produkcyjne | 4–6 | 2–3,5 |
| D. Go-live | 2,5–3,5 | 2–3 |
| E. Rezerwacje + płatności (Opcja A) | 4–8 | 3,5–7 |
| F. Wpięcie CMS (Sveltia) | 2,5–4,5 | 1,5–3 |
| **RAZEM (A–F)** | ~21,5–35 | **~13–23 osobodni** |

- **Estymata SDD zawiera koszt pisania specyfikacji**, który jest tu w dużej części „przedpłacony" przez istniejące dokumenty (`content-model.md`, `astro-architektura-i-cms.md`, design). Bez tej bazy trzeba by doliczyć spec-authoring — patrz sekcja 9.
- **Czas kalendarzowy** rządzi się lead-time'ami (OTA, treści prawne), nie tylko osobodniami (sekcja 8.4).

---

## 5. Świadomie poza zakresem

| Etap | Uwaga |
|---|---|
| Redesign / nowe zdjęcia / nowe treści | osobny zakres |
| Pisanie regulaminu i polityk (RODO/cookies) | po stronie klienta/prawnika; my integrujemy gotową treść (C.1) |
| Wersja językowa EN | Sveltia wspiera i18n, ale tłumaczenia i dodatkowe szablony to osobny nakład |

---

## 6. Ryzyka wpływające na estymację

| Ryzyko | Wpływ |
|---|---|
| Opóźnienie treści prawnych od klienta | blokuje C.1 i go-live (nie blokuje prac dev A–B) |
| Lead-time akceptacji konta / połączeń OTA | blokuje domknięcie Fazy E (uruchomić wcześnie) |
| Migracja SEO gorsza niż zakładana (dużo starych URL) | rozszerza D.1 |
| Konieczność redesignu/nowych zdjęć | poza obecną wyceną — osobny zakres |
| Nietypowe pakiety (wesele+nocleg, grupy) niemieszczące się w gotowym silniku | wymusza własny silnik (Opcja B z dok. rezerwacji) — istotnie większy nakład |

---

## 7. Rekomendowana kolejność

1. **Fazy A–B** (fundament + komponentyzacja + wydzielenie treści) — rdzeń gotowości pod CMS.
2. **Faza E (rezerwacje) — tor równoległy**: uruchomić wcześnie założenie konta u dostawcy i połączenia OTA (lead-time), konfigurację prowadzić obok Faz B–C.
3. **Faza C** (must-have) — częściowo równolegle; treści prawne zamówić u klienta wcześnie.
4. **Faza F** (wpięcie Sveltii) — po ustabilizowaniu szablonów i danych z Fazy B.
5. **Faza D (go-live)** — po komplecie C, E i F.

---

## 8. Podstawa kompresji SDD + AI (uzasadnienie estymat z sekcji 4)

Metoda przyjęta to **spec-driven + AI** (najpierw precyzyjna specyfikacja/openspec, potem AI generuje kod, człowiek weryfikuje i iteruje). Poniżej uzasadnienie, dlaczego kolumna SDD z sekcji 4 wygląda tak, a nie inaczej — i gdzie kompresja NIE działa.

### 8.1. Gdzie AI realnie przyspiesza, a gdzie nie

Kluczowa obserwacja: **kompresja dotyczy pracy „kodowej/mechanicznej", nie konfiguracji, decyzji i lead-time'ów.**

| Charakter pracy | Przykłady w planie | Podatność na AI |
|---|---|---|
| Mechaniczna transformacja kodu | B.1–B.6 (15 stron HTML → komponenty + dane), C.4 (schema.org, sitemap), C.2/C.3 (baner, formularz) | 🟢 **wysoka** — powtarzalne, dobrze specyfikowalne |
| Konfiguracja narzędzi | A.2, F.1–F.3 | 🟡 średnia — AI pomaga, ale sporo klikania w panelach |
| Konfiguracja zewnętrznych SaaS | E.1–E.4 (silnik, channel manager, bramka) | 🔴 **niska** — praca w cudzym panelu, nie w kodzie |
| Testy / QA / weryfikacja | D.3, E.6, F.4 | 🟡 średnia — AI generuje przypadki, ale człowiek musi potwierdzić (płatność, overbooking) |
| Lead-time i decyzje | akceptacja OTA, treści prawne, wybór finalisty | ⚫ **zero** — AI nie skróci procesów zewnętrznych |

### 8.2. Synergia: dokumenty designowe SĄ już specyfikacją

Spec-driven development wymaga zwykle **wcześniejszej inwestycji w napisanie specyfikacji**. W tym projekcie ta praca jest **w dużej mierze już wykonana** — dokumenty w `docs/` (design rezerwacji, CMS, architektura Astro, schemat treści) pełnią rolę specyfikacji. To realna przewaga: koszt „pisania specu" jest częściowo zamortyzowany, a AI ma z czego generować.

### 8.3. Skorygowane estymaty (AI + spec-driven)

Zastosowane współczynniki kompresji odzwierciedlają tabelę z 8.1 (mocna kompresja w B/C/F, słaba w D/E).

| Faza | Bazowo | Z AI + spec-driven | Główne źródło oszczędności |
|---|---|---|---|
| A. Fundament | 1–1,5 | 0,5–1 | scaffolding, boilerplate configów |
| B. Komponentyzacja + treść | 7,5–11,5 | **3,5–5,5** | masowa transformacja HTML→Astro + generacja danych |
| C. Must-have | 4–6 | 2–3,5 | schema.org/sitemap/baner/formularz z gotowych wzorców |
| D. Go-live | 2,5–3,5 | 2–3 | QA/DNS/redirecty słabo kompresowalne |
| E. Rezerwacje (Opcja A) | 4–8 | 3,5–7 | tylko E.5 (kod widgetu) się kompresuje; reszta = panele SaaS |
| F. Wpięcie CMS (Sveltia) | 2,5–4,5 | 1,5–3 | `config.yml` generowany ze schematu B.4 |
| **RAZEM (A–F)** | **~21,5–35** | **~13–23 osobodni** |  |

**Efekt: redukcja nakładu dev o ~35–40%**, skoncentrowana w fazach kodowych (B, C, F).

### 8.4. Czego AI/spec-driven NIE zmienia (uczciwe zastrzeżenia)

- **Lead-time governuje kalendarz.** Nawet przy 40% mniej pracy dev, akceptacja połączeń OTA, treści prawne od prawnika i decyzje klienta ustawiają **dolną granicę czasu kalendarzowego** — oszczędność „wall-clock" jest mniejsza niż oszczędność osobodni.
- **Weryfikacja pozostaje ludzka.** Kod z AI trzeba przejrzeć i przetestować; przepływu płatności i anty-overbookingu **nie wolno** przyjąć „na wiarę". QA kompresuje się słabo.
- **Jakość specu = jakość wyniku.** Spec-driven działa dobrze tylko przy precyzyjnej specyfikacji (tu: mamy dobrą bazę w `docs/`). Niedookreślony spec → iteracje i poprawki, które zjadają oszczędność.
- **Faza E prawie się nie kurczy** — bo to konfiguracja w cudzych panelach i procesy zewnętrzne, nie kod.

### 8.5. Wniosek

Z AI i spec-driven **realny nakład dev spada z ~21,5–35 do ~13–23 osobodni** (~35–40% mniej), ale **czas kalendarzowy skraca się mniej**, bo rządzą nim lead-time'y (OTA, treści prawne) i ludzka weryfikacja krytycznych przepływów. Największy zysk jest w **Fazie B** (mechaniczna migracja 15 stron) — i to tam warto najmocniej wykorzystać AI. Posiadane dokumenty designowe działają jak gotowa specyfikacja, co dodatkowo poprawia opłacalność tego podejścia.

---

## 9. Gotowość dokumentacji do SDD (czy da się łatwo generować specy?)

Ocena, na ile obecne `docs/` pozwalają **łatwo wygenerować openspecy** — bo od tego zależy, czy estymaty SDD z sekcji 4 są realne (kompresja zakłada, że spec-authoring jest w większości „przedpłacony" dokumentami).

### 9.1. Co jest gotowe (mocne strony dla SDD)

| Warstwa speca | Pokrycie w dokumentacji | Ocena |
|---|---|---|
| **„Co"** (model danych, pola) | `content-model.md` — kolekcje, pola, typy Zod, widgety Sveltii | 🟢 bardzo dobre |
| **„Jak"** (mechanizm techniczny) | `astro-architektura-i-cms.md` — wzorce, przykłady konfiguracji | 🟢 dobre |
| **„Dlaczego"** (decyzje, ograniczenia) | design-doci + log decyzji w README | 🟢 dobre |
| **Podział na spec-sized chunki** | `roadmap.md` — elementy z gotowymi nazwami openspeców | 🟢 dobre |

Wniosek: to poziom **znacznie powyżej przeciętnej** — triada „co/jak/dlaczego" jest pokryta, a roadmapa dostarcza gotowe granice speców. To realnie uzasadnia kompresję z sekcji 4.

### 9.2. Luki, które utrudnią lub zablokują spec-authoring

| Luka | Wpływ na SDD | Jak domknąć |
|---|---|---|
| **Kryteria akceptacji per element**, a nie tylko per kamień (DoD jest na poziomie milestone) | każdy openspec potrzebuje własnych testowalnych kryteriów | rozpisać AC per element (szybkie — z DoD roadmapy) |
| **Niefunkcjonalne niezmierzone**: budżet wydajności (LCP/CLS), poziom WCAG, wymagane pola schema.org | specy C.4/C.6/D.3 będą nieostre („zielony Lighthouse" to za mało) | dodać konkretne progi do speców |
| **Kontrakty integracji zależne od decyzji**: dokładny sposób osadzenia widgetu (Hotres vs Beds24), pola formularza Formspree, mapa 301 (wymaga crawla starej strony) | specy M5 i D nie do domknięcia przed decyzją/inputem | rozstrzygnąć spike'i (M0) + crawl starej domeny |
| **Inwentarz komponentów/CSS** (mapowanie klas `style.css` → komponenty) | spec komponentyzacji (M1/M2) mniej precyzyjny | jednorazowy audyt CSS przy M1 |
| **Treści prawne od klienta** | spec `strony-prawne` niepełny do czasu dostarczenia treści | zamówić wcześnie (lead-time) |

### 9.3. Werdykt

**Tak — dokumentacja pozwala na łatwy SDD**, z zastrzeżeniem trzech rzeczy:
1. **Specy „danych" i „szablonów" (M1, M2, M4) są gotowe do wygenerowania od zaraz** — `content-model.md` + `astro-architektura-i-cms.md` dają niemal komplet.
2. **Specy „must-have" (M3) i „go-live" (M6) wymagają dopisania mierzalnych kryteriów** (progi wydajności, WCAG, pola schema, mapa 301) — mały nakład.
3. **Specy „rezerwacji" (M5) są zablokowane** do rozstrzygnięcia spike'a *Hotres vs Beds24* — bo kontrakt osadzenia widgetu i konfiguracja bramki zależą od finalisty.

Praktyczny wniosek dla estymat: kompresja SDD z sekcji 4 jest **wiarygodna dla M1/M2/M4** (rdzeń nakładu). Dla M3/M5/M6 utrzymujemy szersze widełki, dopóki luki z 9.2 nie zostaną domknięte. Domknięcie tych luk to **~0,5–1 osobodnia** pracy „dopracowania speców" — i tyle warto doliczyć, zanim uznamy estymaty SDD za twarde.
