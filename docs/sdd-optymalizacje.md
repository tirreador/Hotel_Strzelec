# Optymalizacje wykonania SDD (grupa C) — Hotel Strzelec Wrocław

> Status: **referencja / praktyki**
> Autor: zespół deweloperski
> Data: 2026-07-13
> Powiązane: [`plan-wdrozenia-i-estymacje.md`](./plan-wdrozenia-i-estymacje.md) (estymaty), [`roadmap.md`](./roadmap.md), [`content-model.md`](./content-model.md)
>
> Techniki **wykonania** przy spec-driven development + AI. W odróżnieniu od optymalizacji zakresu (URL 1:1, zakres CMS) i samej metody (SDD+AI) — te dotyczą **jak** realizować specy szybciej i z mniejszym reworkiem. Ich pełny efekt jest **warunkowy: wymaga dyscypliny i doświadczenia** (stąd większy zysk u seniora — patrz sekcja „Wpływ na estymację").

---

## 1. Techniki

### 1.1. „Złoty przykład" + replikacja
**Co:** jedną reprezentatywną jednostkę robisz wzorcowo (ręcznie/dopieszczoną), a AI **replikuje wzorzec** na resztę.
**W tym projekcie:** zrób `pokoje.astro` + komplet komponentów wzorcowo; spec dla pozostałych 14 stron brzmi „wg wzorca `pokoje.astro`". AI działa dużo lepiej na przykładzie do naśladowania niż na opisie od zera.
**Zysk:** największa dźwignia na **Fazę B**; spójność, mniej poprawek.

### 1.2. „GrillMe" — interrogacja przed napisaniem specu
**Co:** AI **przesłuchuje** autora pytaniami, zanim powstanie spec — wyciąga przypadki brzegowe i ukryte założenia.
**W tym projekcie:** np. `channel-manager-ota` — „co przy podwójnej rezerwacji w oknie sync? pobyty na styku dób? pokój bez łazienki?".
**Zysk:** mniej iteracji i reworku; spec z gotowymi kryteriami akceptacji.

### 1.3. Kryteria akceptacji jako **automatyczne testy**
**Co:** AC ze specu zapisujesz jako testy wykonywalne, nie checklistę do ręcznego sprawdzenia.
**W tym projekcie:** Playwright (flow rezerwacji: widget → płatność testowa → panel), **visual diff** (parytet 15 stron ze starym prototypem), axe (a11y), Lighthouse CI (progi wydajności).
**Zysk:** **kompresuje QA** (D/E/F) — jedyny sposób, by ruszyć dolną granicę widełek; review maszynowy zamiast ręcznego.

### 1.4. Ciasne pętle self-correction
**Co:** bramki, na których AI iteruje bez człowieka: `tsc` + lint + `astro build` + testy z 1.3.
**Zysk:** mniej rund „człowiek patrzy"; część D.3/E.6/F.4 z ręcznej staje się automatyczna.

### 1.5. Równoległość (git worktrees / subagenty)
**Co:** niezależne specy realizowane naraz w osobnych worktree.
**W tym projekcie:** tor B (rezerwacje) obok toru A; różne kolekcje/strony w M2 równolegle.
**Zysk:** **skraca kalendarz** (nie osobodni) — atakuje wąskie gardło SDD, którym był czas.

### 1.6. Right-sizing speców
**Co:** 1 kolekcja / 1 komponent = 1 spec. Za duże → AI gubi wątek; za małe → narzut.
**Zysk:** mniej błędów → mniej iteracji.

### 1.7. Definition of Ready
**Co:** spec nie startuje bez domkniętych inputów i AC.
**W tym projekcie:** `strony-prawne` czeka na treść klienta; specy zależne od decyzji ruszają po jej podjęciu.
**Zysk:** brak blokad w połowie zadania.

### 1.8. Kontekst celowany
**Co:** AI dostaje wycinek dokumentu istotny dla speca, nie całe repo.
**W tym projekcie:** sekcja `pokoje` z `content-model.md` do speca kolekcji pokoi.
**Zysk:** mniej halucynacji, szybsza i celniejsza generacja.

### 1.9. Ryzykowne najpierw
**Co:** elementy o największej niepewności specyfikujesz i testujesz wcześnie.
**W tym projekcie:** płatność i synchronizacja (E.3–E.4) przed boilerplate.
**Zysk:** wczesne wykrycie problemów, mniej późnego reworku.

### 1.10. Gotowce zamiast pisania
**Co:** wykorzystanie gotowych integracji/bibliotek zamiast kodu własnego.
**W tym projekcie:** `@astrojs/sitemap`, Astro Image, biblioteka cookie-consent, Formspree, CI/CD z pudełka (Cloudflare/Netlify).
**Zysk:** tańsze C.2/C.3/C.4 i A.2.

---

## 2. Wpływ na estymację (mid vs senior)

Grupa C **zawęża górną granicę** względem surowego SDD+AI (~11,5–20,5 z planu §4) — głównie tnąc rework i ręczne QA. Jej pełny zysk jest **warunkowy**: senior realnie wdraża 1.1/1.3/1.4/1.5 (złoty przykład, automatyczne testy, pętle, równoległość), mid — częściowo.

Różnica **mid ↔ senior** koncentruje się tam, gdzie liczy się **osąd, jakość specu i automatyzacja** (B/C/D/F). **Faza E niemal się nie zmienia** — to konfiguracja w panelach dostawcy + lead-time OTA, niezależne od doświadczenia.

| Faza | Mid (SDD+AI+grupa C) | Senior (SDD+AI+grupa C) |
|---|---|---|
| A. Fundament | 0,5–1 | 0,5–0,75 |
| B. Komponentyzacja + treść | 3–4,5 | 2–3,5 |
| C. Must-have (rdzeń) | 1,5–2,5 | 1–2 |
| D. Go-live | 1,25–2 | 1–1,5 |
| E. Rezerwacje + płatności | 3,5–6,5 | 3–5,5 |
| F. Wpięcie CMS (Sveltia) | 1,25–2,5 | 1–1,75 |
| S. Generacja speców z dokumentacji | 0,5–1,5 | 0,4–1 |
| **RAZEM (A–F + S)** | **~11,5–20 osobodni** | **~9–16 osobodni** |
| C.5 analityka (opcjonalnie) | +0,25 | +0,25 |

> **Pozycja S** — inicjalizacja ~20 openspeców z istniejącej dokumentacji (AI generuje szkic → review + AC + GrillMe dla ryzykownych). Docs mocno ją redukują, ale nie do zera.

**Zastrzeżenie (podłoga):** żadna technika nie obejdzie lead-time'u akceptacji połączeń OTA, ludzkiej weryfikacji płatności produkcyjnej ani konfiguracji w panelach dostawcy (Faza E). Dlatego E pozostaje najmniej ściśliwa w obu rolach.
