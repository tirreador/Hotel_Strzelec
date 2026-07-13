# Roadmapa wdrożenia — Hotel Strzelec Wrocław

> Status: **żywy dokument** (aktualizowany w trakcie)
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) (źródło faz/estymat), [`content-model.md`](./content-model.md), [`system-rezerwacji-design.md`](./system-rezerwacji-design.md), [`astro-architektura-i-cms.md`](./astro-architektura-i-cms.md)
>
> **Cel dokumentu:** przełożyć plan i design na **sekwencję kamieni milowych (milestones)** o jasnym rezultacie i warunku zakończenia (DoD). Każdy kamień jest bazą do wytworzenia **openspeców / zadań**. Estymaty są **wyprowadzone z planu** (nie duplikujemy ich jako źródła prawdy — plan pozostaje autorytatywny).

---

## 1. Jak czytać tę roadmapę

- **Milestone (M#)** = zamykalny przyrost wartości, mapowany na fazy z planu.
- **DoD** = warunek „gotowe" — kryteria akceptacji, które trafią do openspeca.
- **Elementy** = kandydaci na osobne openspecy/zadania.
- **Estymata** = zakres osobodni zwinięty z odpowiednich kroków planu (scenariusz bazowy; wariant AI patrz plan §8).
- **Spike** = element badawczo-decyzyjny (rozstrzygnięcie niewiadomej), nie kod.

Dwa równoległe tory:
- **Tor A — Strona/CMS:** M0 → M1 → M2 → M3 → M4 → M6.
- **Tor B — Rezerwacje:** M5, startuje wcześnie (lead-time OTA), domykany przed M6.

---

## 2. Kamienie milowe

### M0 — Fundament i decyzje startowe
**Rezultat:** działające repo produkcyjne z auto-deployem; rozstrzygnięte niewiadome blokujące.
**Mapowanie planu:** Faza A (+ spike'i). **Estymata:** ~1,5–2 dnia.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Repo + hosting (Cloudflare/Netlify Pages) + domena robocza + HTTPS | zadanie | `infra-setup` |
| Skeleton Astro + CI/CD (build na push) | zadanie | `astro-bootstrap` |
| **Wybór finalisty silnika: Hotres vs Beds24** | spike | `decyzja-silnik` |
| **Decyzja: wersja EN tak/nie** | spike | `decyzja-i18n` |

**DoD:** pusty projekt Astro buduje się i deployuje automatycznie; decyzje silnika i EN zapisane w README (log decyzji).

---

### M1 — Szkielet + komponentyzacja (PoC architektury)
**Rezultat:** potwierdzona architektura na żywo — layout + komponenty współdzielone + 1–2 realne podstrony przepisane z prototypu.
**Mapowanie planu:** część Fazy B (B.1, B.2 + pilotaż B.3). **Estymata:** ~2–3 dni.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Layout bazowy (`Base.astro`) + `<head>`/SEO props | zadanie | `layout-base` |
| Komponenty: Header, Footer, Nav, MobileBar | zadanie | `komponenty-nawigacja` |
| Singleton `settings` (dane firmy/kontakt) | zadanie | `dane-globalne` |
| Pilotaż: `index` + `pokoje` na nowym szablonie | zadanie | `migracja-pilot` |

**DoD:** dwie podstrony wyglądają 1:1 jak prototyp, ale header/stopka/kontakt pochodzą z jednego źródła; zmiana telefonu w `settings` propaguje się wszędzie.

---

### M2 — Pełna migracja treści do danych
**Rezultat:** wszystkie 15 podstron na szablonach; cała treść wydzielona wg `content-model.md`.
**Mapowanie planu:** reszta Fazy B (B.3, B.4, B.5, B.6). **Estymata:** ~5–8,5 dnia.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Kolekcje wg modelu: `pokoje`, `oferta`, `galeria`, `oferty-pracy`, `zastawa`, `aktualnosci` | zadanie | `kolekcje-tresci` |
| Singletony: `strona-glowna`, `o-nas`, `kontakt`, `menu` | zadanie | `singletony-tresci` |
| Migracja pozostałych podstron do szablonów | zadanie | `migracja-pozostale` |
| Inline-style → CSS; port `main.js` (galeria/lightbox/hamburger) | zadanie | `porzadki-front` |

**DoD:** żadna treść nie jest „wklejona" w HTML — wszystko czytane przez `getCollection`/dane; wizualnie zgodne z prototypem; `content-model.md` w pełni odwzorowany.

---

### M3 — Produkcyjne must-have (prawne, SEO, wydajność)
**Rezultat:** strona spełnia wymogi wejścia na produkcję (prawne + SEO + performance).
**Mapowanie planu:** Faza C. **Estymata:** ~4–6 dni.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Strony prawne (RODO, regulamin, cookies) — integracja treści klienta | zadanie | `strony-prawne` |
| Baner zgody cookies | zadanie | `cookie-consent` |
| Formularz kontaktowy (Formspree) + walidacja + zgoda RODO + anty-spam | zadanie | `formularz-kontakt` |
| SEO techniczne: sitemap, robots, canonical, schema.org `LodgingBusiness` | zadanie | `seo-techniczne` |
| Analityka: GA4/Plausible + Search Console + GBP | zadanie | `analityka` |
| Wydajność: WebP/AVIF, preload fontów, width/height | zadanie | `wydajnosc-obrazy` |

**DoD:** komplet stron prawnych podlinkowany; baner cookies działa; formularz wysyła; sitemap/robots/schema poprawne; Lighthouse w zielonych zakresach.
**Zależność zewnętrzna:** treści prawne od klienta (zamówić w M0/M1).

---

### M4 — CMS live (Sveltia)
**Rezultat:** właściciel edytuje treść przez panel; zmiana → commit → rebuild → publikacja.
**Mapowanie planu:** Faza F. **Estymata:** ~2,5–4,5 dnia.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Sveltia + `config.yml` (kolekcje 1:1 z `content-model.md`) | zadanie | `sveltia-config` |
| Uwierzytelnianie (Authenticator na Cloudflare Workers / OAuth GitHub) | zadanie | `sveltia-auth` |
| Media (upload zdjęć) + opcjonalny editorial workflow | zadanie | `sveltia-media` |
| Testy edycji end-to-end + instrukcja i szkolenie właściciela | zadanie | `cms-szkolenie` |

**DoD:** właściciel loguje się, edytuje pokój/galerię/tekst, publikuje bez pomocy dev; instrukcja gotowa.

---

### M5 — Rezerwacje + płatności (Opcja A) — TOR RÓWNOLEGŁY
**Rezultat:** gość rezerwuje i płaci bezpośrednio; dostępność zsynchronizowana z OTA (anty-overbooking).
**Mapowanie planu:** Faza E. **Estymata:** ~4–8 dni. **Start:** wcześnie (lead-time), niezależnie od M1–M4.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Konto u dostawcy + konfiguracja obiektu (polityki, regulamin) | zadanie | `silnik-konto` |
| Mapowanie typów pokoi + ceny/sezony/restrykcje | zadanie | `silnik-pokoje-ceny` |
| Channel manager: Booking+Agoda+portale PL + testy synchronizacji | zadanie | `channel-manager-ota` |
| Bramka (Przelewy24) + model zaliczki + testy transakcji | zadanie | `platnosci-brama` |
| Osadzenie i stylizacja widgetu na `/rezerwacja` | zadanie | `widget-embed` |
| Testy end-to-end + szkolenie recepcji | zadanie | `rezerwacje-e2e` |

**DoD:** rezerwacja testowa przechodzi (widget → płatność → panel), sprzedaż na OTA zdejmuje dostępność w oknie sekundowym; recepcja przeszkolona.
**Zależność zewnętrzna:** akceptacja konta i **zatwierdzenie połączeń OTA** (kilka dni kalendarzowych) — uruchomić w M0.

---

### M6 — Go-live
**Rezultat:** nowa strona na docelowej domenie, ruch i SEO przeniesione bez strat.
**Mapowanie planu:** Faza D. **Estymata:** ~2,5–3,5 dnia.

| Element | Typ | Kandydat na openspec |
|---|---|---|
| Mapa starych URL → nowych + przekierowania 301 | zadanie | `redirecty-301` |
| Przełączenie domeny, DNS, weryfikacja HTTPS | zadanie | `domena-cutover` |
| QA końcowe (a11y, mobile, linki, formularze, płatność testowa) | zadanie | `qa-koncowe` |
| Monitoring + Search Console submit + bufor na poprawki | zadanie | `go-live-monitoring` |

**DoD:** domena wskazuje na nową stronę; stare adresy przekierowane 301; QA bez blokerów; monitoring aktywny.

---

## 3. Sekwencja i ścieżka krytyczna

```
Tor A (strona/CMS):   M0 ──► M1 ──► M2 ──► M3 ──► M4 ──┐
                                                        ├──► M6 (go-live)
Tor B (rezerwacje):   M0 ──────────► M5 ───────────────┘
                       (start konta OTA wcześnie: lead-time)
```

- **Ścieżka krytyczna toru A:** M1→M2 (komponentyzacja + migracja treści) — największy blok, największa wartość, najlepszy kandydat na przyspieszenie AI.
- **Tor B** może iść równolegle od M0; jego realnym ogranicznikiem jest **lead-time OTA**, nie praca dev.
- **M6 wymaga** ukończenia M3, M4 i (dla pełnej sprzedaży) M5.

**Zwinięta estymata (bazowo, z planu):** ~21,5–35 osobodni; wariant AI/spec-driven ~13–23 (plan §8).

---

## 4. Jak z tej roadmapy robić openspecy / zadania

1. **Jeden element = jeden openspec.** Nazwa speca = `kandydat na openspec` z tabel.
2. **Każdy spec dziedziczy kontekst z dokumentów:** design (`*-design.md`) → *dlaczego*, `content-model.md` → *co* (pola/kolekcje), `astro-architektura-i-cms.md` → *jak*.
3. **Kryteria akceptacji speca = DoD kamienia** (zawężone do danego elementu).
4. **Estymata speca:** rozbij zakres kroku planu na elementy; suma ≈ estymata kamienia (kontrola spójności z planem).
5. **Kolejność realizacji:** wg sekcji 3 (ścieżka krytyczna); tor B startuje niezależnie.
6. **Aktualizacja:** po zamknięciu kamienia odhacz DoD i zaktualizuj plan, jeśli rzeczywisty nakład odbiegł (feedback do przyszłych estymat).

---

## 5. Wpływ roadmapy na jakość estymat

| Mechanizm | Efekt |
|---|---|
| Dekompozycja na zamykalne elementy | mniejsza wariancja estymat (błędy się uśredniają) |
| Jawne DoD | mniej scope creep i doszacowań w trakcie |
| Spike'i (decyzja-silnik, i18n) | niewiadome rozstrzygane wcześnie, nie w trakcie kodowania |
| Ścieżka krytyczna + tory równoległe | realny czas **kalendarzowy**, nie tylko osobodni |
| 1 element = 1 openspec | precyzyjne specy → przewidywalny wynik AI (kompresja z planu §8 pewniejsza) |

Roadmapa nie zmniejsza nakładu — **zmniejsza niepewność estymat i ryzyko sekwencjonowania**, pod warunkiem bieżącej aktualizacji.
