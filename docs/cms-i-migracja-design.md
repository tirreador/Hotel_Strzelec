# Dokument designowy — CMS i migracja prototyp → produkcja (Hotel Strzelec Wrocław)

> Status: **zaktualizowany — decyzja podjęta**
> Autor: zespół deweloperski
> Data: 2026-07-13
> Zakres: przejście obecnego statycznego prototypu do wersji produkcyjnej z systemem zarządzania treścią (CMS). Rezerwacje i płatności opisane w osobnym dokumencie ([`system-rezerwacji-design.md`](./system-rezerwacji-design.md)); tutaj traktowane jako niezależna warstwa (widget).
>
> **✅ Decyzja: Opcja 1** (SSG **Astro** + Git-based **Sveltia** CMS). Opcje 2–3 zostają jako uzasadnienie odrzucenia. Konkretny model treści: [`content-model.md`](./content-model.md); kroki i wycena: [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) (jedyne źródło faz/estymat).

---

## 1. Cel i kontekst

Hotel Strzelec (ul. Świątnicka 36, Wrocław — 51 pokoi, restauracja, catering, wesela/bankiety) ma dopracowany **statyczny prototyp** strony. Cel: doprowadzić go do wersji **produkcyjnej z CMS**, aby właściciel mógł samodzielnie edytować treści (teksty, ceny, zdjęcia, menu), przy zachowaniu obecnego wyglądu.

Ten dokument analizuje, **co trzeba zrobić**, jakie są **opcje realizacji CMS** i jak wygląda **plan migracji**. Rezerwacje/płatności wchodzą osobnym torem jako osadzony widget i nie są tu rozwijane.

---

## 2. Diagnoza obecnego stanu

### 2.1. Co jest już na poziomie produkcyjnym (mocne strony)
- Dopracowany, spójny design; jeden ręczny `assets/css/style.css` (~30 KB), bez frameworka — lekki.
- **Realne zdjęcia** (nie placeholdery) w `assets/img/` — ~55 plików, pogrupowane tematycznie (hero, pokoje, restauracja, wesela, catering, galeria). Prototyp jest wizualnie gotowy.
- Dobra semantyka i dostępność: `skip-link`, atrybuty `aria-*`, `role`, `loading="lazy"`, sensowne `alt`.
- SEO on-page per strona: unikalne `<title>`, `meta description`, Open Graph.
- Responsywność: mobilna nawigacja (hamburger) i dolny pasek szybkiego kontaktu.
- Jeden plik `assets/js/main.js` (hamburger, galeria, lightbox, rok w stopce) — bez zależności zewnętrznych.

### 2.2. Dług techniczny (blokuje CMS i produkcję)
1. **Powielony header/stopka/nawigacja w 15 plikach HTML** — i **niespójnie**: podstrony używają komentarzy `HEADER START/END`, a `index.html` tylko `<!-- HEADER -->`. Zmiana jednej pozycji menu = edycja 15 plików. **Główny problem architektoniczny.**
2. **Dane kontaktowe/telefony powielone** w każdej stopce i sekcjach CTA (README zaleca zmianę numeru `sed`-em po wszystkich plikach).
3. **Style inline** rozsiane po HTML (`style="columns:3..."`, `style="background-image..."`) — utrudniają edycję treści.
4. **Martwe elementy:** formularz kontaktowy `action="#"` (niepodłączony), linki społecznościowe `href="#"`, `<link rel="canonical">` zakomentowany.
5. **Zdjęcia tylko `.jpg`** — istnieje skrypt `scripts/optimize-images.js` do WebP, ale **nie został wdrożony** (brak plików `.webp`). Strata wydajności.
6. **Brak build-stepu** — nie ma warstwy, w którą CMS mógłby wpiąć treść.

---

## 3. Braki produkcyjne niezależne od CMS (must-have przed startem)

Poniższe trzeba dodać **niezależnie** od wyboru CMS. Część jest **obowiązkowa prawnie**, tym bardziej że dochodzą rezerwacje i płatności online.

| Obszar | Co brakuje | Priorytet |
|---|---|---|
| **Prawne (RODO)** | Polityka prywatności, klauzula informacyjna (dane gości), **regulamin rezerwacji/świadczenia usług** (wymagany przy płatnościach online), polityka cookies | 🔴 krytyczny |
| **Cookies** | Baner zgody na cookies (analityka/marketing) | 🔴 krytyczny |
| **Formularz** | Podpięcie (Formspree/backend), walidacja, ochrona anty-spam, zgoda RODO w formularzu | 🔴 |
| **SEO techniczne** | `sitemap.xml`, `robots.txt`, odkomentowanie `canonical`, dane strukturalne **schema.org `LodgingBusiness`/`Hotel`** | 🟠 |
| **Analityka** | GA4 lub Plausible + Google Search Console + Google Business Profile | 🟠 |
| **Wydajność** | Wdrożenie **WebP/AVIF**, preload fontów, `width/height` na `<img>` (redukcja CLS) | 🟠 |
| **Hosting/infra** | Domena, HTTPS, hosting, CI/CD (deploy przy zmianie treści) | 🔴 |
| **Migracja z obecnej strony** | Obecny `strzelecwroclaw.pl` to **WordPress** (README używa `wp-json`). Zachowanie SEO: mapowanie starych URL → nowych, **przekierowania 301** | 🟠 |

**Uwaga o migracji SEO:** obecna domena ma historię i ruch. Zmiana adresów podstron bez przekierowań 301 = utrata pozycji w Google.

---

## 4. Sedno problemu: CMS wymaga warstwy szablonów

CMS „dokleja się" do treści — ale obecna strona **nie ma warstwy, w którą CMS mógłby wpiąć treść**. 15 samodzielnych plików HTML z powielonym headerem to model nie do utrzymania z CMS-em.

Przejście na CMS **z definicji** wymusza wprowadzenie warstwy komponentów/szablonów, gdzie:
- header, stopka, nawigacja, dane kontaktowe → **jeden komponent** (edytowany raz),
- treść stron → **dane** (Markdown / pola CMS) wstrzykiwane do szablonu.

Ta praca jest konieczna niezależnie od wyboru CMS — różni się tylko technologia. **Nie da się dodać sensownego CMS bez tego kroku.** Jednocześnie spłaca dług techniczny z sekcji 2.2.

---

## 5. Zakres CMS — co ma być edytowalne

Mapowanie treści prototypu na „edytowalne obiekty" (definiuje model danych CMS):

| Obiekt treści | Przykład | Częstotliwość zmian |
|---|---|---|
| **Globalne dane kontaktowe** | telefony, adres, godziny, social | rzadko, ale dziś powielone → priorytet |
| **Teksty strony głównej** | hero, sekcja „ścieżki", trust | czasem |
| **Pokoje** | opis, standard Classic/Comfort, cena orientacyjna, zdjęcia | sezonowo |
| **Oferta imprez / wesela / catering** | opisy, listy usług | czasem |
| **Menu restauracji** | podmiana PDF lub menu strukturalne | często |
| **Galeria** | dodawanie/usuwanie zdjęć, kategorie | często |
| **Aktualności / oferty specjalne** | np. „pakiet sylwestrowy" | często |
| **SEO per strona** | title, description, OG image | rzadko |
| **Oferty pracy** | `praca.html` | czasem |

Wniosek: właściciel potrzebuje głównie edycji **tekstów, cen, zdjęć galerii i menu** — prosty zakres. Nie potrzeba CMS klasy enterprise.

---

## 6. Opcje realizacji CMS (z oceną)

### Opcja 1 — Static Site Generator + Git-based CMS ⭐ rekomendacja
**Stack:** Astro (lub Eleventy) + Decap/Sveltia CMS. Header/stopka/nav → komponenty; treść → Markdown/pliki danych; CMS to panel WWW zapisujący do repo; deploy automatyczny (Cloudflare/Netlify Pages). Techniczny opis działania Astro i integracji z CMS: [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md).
- **Koszt:** hosting ~0 zł, CMS ~0 zł.
- **Plusy:** zachowujemy obecny lekki design/CSS niemal 1:1; strona zostaje błyskawiczna i bezpieczna (brak bazy/PHP); Git = pełna historia zmian; darmowe utrzymanie.
- **Minusy:** panel prostszy niż WordPress; podgląd zmian po deployu (kilkadziesiąt sekund); wymaga naszej pracy przy modelu treści.
- **Nakład:** przepisać 15 stron na szablony + komponenty + wpiąć CMS (jednorazowo; gros pracy = komponentyzacja headera/stopki, i tak konieczna).

### Opcja 2 — SSG + headless SaaS CMS (Sanity / Strapi)
Jak wyżej, ale treść w chmurowym CMS z bogatszym edytorem i podglądem na żywo.
- **Koszt:** Sanity darmowy tier zwykle wystarcza; Strapi self-host = VPS ~20–40 zł/mc.
- **Plusy:** lepszy edytor, live preview, obrazy z CDN i transformacjami.
- **Minusy:** kolejny zewnętrzny system i zależność; dla tak małej strony bywa nadmiarowy.

### Opcja 3 — WordPress (motyw z prototypu)
Przepisanie prototypu na motyw WP; właściciel dostaje znany panel; wtyczki rezerwacji (Hotel Booking/MotoPress).
- **Koszt:** hosting ~30–80 zł/mc + utrzymanie/aktualizacje/bezpieczeństwo.
- **Plusy:** najbardziej znajomy panel; „wszystko w jednym" (rezerwacje jako wtyczka).
- **Minusy:** cięższy, wolniejszy, większa powierzchnia ataku (aktualizacje, backupy); trzeba wiernie odtworzyć design w PHP; sprzeczny z „lekką statyczną stroną", którą już mamy. Co ciekawe, obecna produkcyjna strona **prawdopodobnie działa na WordPressie** (README projektu korzysta z `wp-json` przy pobieraniu zdjęć), od którego prototyp odchodzi.

**Rekomendacja: Opcja 1.** Najlepiej pasuje do tego, co już mamy (statyczny, dopracowany front), jest darmowa w utrzymaniu, a rezerwacja/płatność i tak wchodzą jako zewnętrzny widget.

---

## 7. Relacja CMS ↔ rezerwacje/płatności

Kluczowe: **CMS i silnik rezerwacji to dwie niezależne warstwy.** Niezależnie od wybranej opcji CMS, silnik rezerwacji (Sirvoy/Hotres/Beds24 — patrz osobny dokument) wchodzi jako **osadzony widget** na podstronie „Rezerwacja", a płatność obsługuje bramka w tym widgecie. CMS zarządza tylko treścią „dookoła".

```
[SSG + CMS: treść, wygląd]  ─┐
                             ├─►  jedna strona produkcyjna
[Widget silnika rezerwacji] ─┘     (widget na podstronie /rezerwacja)
```

Konsekwencja projektowa: **wybór CMS nie blokuje wyboru silnika** — można je wdrażać równolegle.

---

## 8. Plan migracji (fazami)

Szczegółowy, wyceniony plan faz (A–F) oraz kolejność prac znajdują się w **[`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md)** — to jedyne źródło prawdy dla faz i estymat (żeby uniknąć rozjazdu numeracji).

W skrócie: fundament (repo/hosting) → komponentyzacja + wydzielenie treści (rdzeń, spłaca dług z 2.2) → must-have produkcyjne (prawne/SEO/wydajność) → wpięcie Sveltii → rezerwacje (tor równoległy) → go-live (301, przełączenie domeny). Konkretny model treści: [`content-model.md`](./content-model.md).

---

## 9. Ryzyka i uwagi do wyceny

- **Największy pojedynczy koszt to komponentyzacja (Faza 1)** — nie licencje. Praca jednorazowa i konieczna niezależnie od CMS.
- **Strony prawne** wymagają treści od klienta/prawnika (regulamin przy płatnościach to nie formalność).
- **Migracja SEO** (301) — pominięcie oznacza spadek pozycji istniejącej domeny.
- **Zdjęcia:** przy okazji warto uruchomić istniejący `scripts/optimize-images.js` (WebP) — szybki zysk wydajności.
- Dobra wiadomość: prototyp jest dojrzały (design, treści, zdjęcia, a11y), więc migracja to głównie **„owinięcie" istniejącego HTML w szablony + CMS**, a nie budowa od zera.

---

## 10. Rekomendacja

1. **Opcja 1** (SSG Astro/Eleventy + Git-based CMS Decap/Sveltia) jako docelowa architektura — zgodna z obecnym lekkim frontem, darmowa w utrzymaniu.
2. Traktować **CMS i rezerwacje jako niezależne tory**, wdrażane równolegle.
3. Nie pomijać **Fazy 3** (prawne/SEO/wydajność) — to warunek wejścia na produkcję, nie „dodatek".
4. Zaplanować **przekierowania 301** przy przełączaniu domeny z obecnego WordPressa.

---

## 11. Kolejne kroki

1. Decyzja klienta: Opcja 1 vs 3 (czy właściciel wymaga panelu „jak WordPress"?).
2. Wybór SSG (Astro rekomendowany) i hostingu (Cloudflare/Netlify Pages).
3. PoC Fazy 1: komponentyzacja 2–3 stron, aby oszacować nakład na całość.
4. Ustalenie modelu treści CMS (sekcja 5) i zebranie treści prawnych od klienta.
5. Harmonogram i wycena faz.
