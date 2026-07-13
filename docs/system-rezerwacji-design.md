# Dokument designowy — System rezerwacji (Hotel Strzelec Wrocław)

> Status: **zaktualizowany — decyzja podjęta**
> Autor: zespół deweloperski
> Data: 2026-07-13
> Zakres: silnik rezerwacji bezpośrednich + synchronizacja z zewnętrznymi serwisami (OTA). Płatności i CMS opisane skrótowo, jako zależności.
>
> **✅ Decyzja: Opcja A** (gotowy silnik + channel manager jako widget). Finaliści doboru dostawcy: **Hotres.pl** / **Beds24** (patrz Załącznik A). Bramka: **Przelewy24**. Opcje B–D zostają w dokumencie jako uzasadnienie odrzucenia.

---

## 1. Cel i kontekst

Hotel Strzelec (ul. Świątnicka 36, Wrocław — **51 pokoi / ~184 miejsca**, standardy Classic i Comfort, dodatkowo restauracja, catering, wesela/bankiety) chce, aby nowa strona umożliwiała **rezerwację online z płatnością**, przy zachowaniu wyglądu obecnego prototypu.

Obecny stan: strona jest **w pełni statyczna** (HTML + jeden `main.js`, brak backendu). Rezerwacja odbywa się telefonicznie; kontakt planowany przez Formspree.

**Cel biznesowy nadrzędny:** nie chodzi o zastąpienie kanałów OTA, tylko o:
1. umożliwienie **rezerwacji bezpośredniej (0% prowizji)** i przeciągnięcie na nią części gości dziś rezerwujących przez Booking.com (~15% prowizji),
2. **bezpieczną synchronizację** dostępności między wszystkimi kanałami, aby wyeliminować overbooking.

Ten dokument skupia się na punkcie 2 — bo to jest **najtrudniejszy technicznie problem** całego systemu.

---

## 2. Stan obecny — kanały sprzedaży

Obiekt jest już wystawiony w wielu miejscach:

| Kanał | Typ | Znaczenie |
|---|---|---|
| **Booking.com** | OTA (dominujący) | ~809 opinii — główne źródło rezerwacji online |
| **Agoda** | OTA | grupa Booking Holdings |
| **Noclegowo.pl, e-turysta, e-nocleg.pl, noclegi-online.pl** | portale PL | częściowo osobne konta |
| **booked.com.pl, Planet of Hotels, Trivago, hotel-pracowniczy.pl** | metasearch / agregatory | zwykle zaciągają ofertę z Booking.com — **nie są osobnym kanałem sprzedaży** |

**Realnych, niezależnych kanałów sprzedaży jest kilka** (Booking.com + Agoda + 1–2 portale PL). Reszta odbija Booking. Do synchronizacji istotne są tylko te realne kanały — ale nawet kilka kanałów przy 51 pokojach wystarcza, by ręczne zarządzanie dostępnością było niewykonalne.

---

## 3. Problem synchronizacji — szczegółowo

### 3.1. Na czym polega problem (overbooking)

Każdy kanał (Booking, Agoda, własna strona, recepcja) ma własny widok dostępności pokoi. Jeśli te widoki nie są spięte w czasie rzeczywistym, ten sam pokój może zostać sprzedany dwa razy:

```
Pokój 4-osobowy Comfort, ostatni wolny na noc 15.08

  10:00  Gość A rezerwuje przez Booking.com   → Booking oznacza: 0 wolnych
  10:01  Gość B rezerwuje przez naszą stronę  → nasza strona wciąż widzi: 1 wolny
  ⇒ OVERBOOKING: dwie potwierdzone rezerwacje na jeden pokój
```

Skutki overbookingu: konieczność odwołania/relokacji gościa, kary umowne od OTA, spadek ratingu na Booking, utrata reputacji. Przy ~800+ rezerwacjach rocznie i kilku kanałach to nie jest przypadek brzegowy — to **codzienne ryzyko**.

### 3.2. Co dokładnie trzeba synchronizować (model danych)

Synchronizacja to nie tylko „wolne / zajęte". Pełny model to trzy warstwy, w skrócie **ARI** (Availability, Rates, Inventory):

- **Inventory (typy pokoi)** — OTA nie sprzedają konkretnego pokoju „nr 214", tylko **typ** (np. „Pokój 4-os. Comfort", pula: 8 sztuk). Trzeba utrzymać wspólne mapowanie typów między naszym systemem a każdą OTA.
- **Availability (dostępność)** — liczba wolnych jednostek danego typu na każdą dobę.
- **Rates (ceny)** — cena za dobę, często zależna od: sezonu, liczby osób, długości pobytu, planu (bezzwrotny vs elastyczny).
- **Restrictions (restrykcje)** — minimalna/maksymalna długość pobytu (MinLOS/MaxLOS), zakaz przyjazdu/wyjazdu w danym dniu (CTA/CTD — Closed to Arrival/Departure), stop-sell.

Synchronizacja musi obejmować **wszystkie te wymiary**, nie tylko dostępność — inaczej ceny/warunki się rozjadą.

### 3.3. Kierunki synchronizacji (dwukierunkowość)

Poprawny system to **dwukierunkowa** wymiana danych:

1. **ARI push (my → OTA):** kiedy pokój zostaje sprzedany (dowolnym kanałem) albo zmieniamy cenę, natychmiast **wypychamy** zaktualizowaną dostępność/cenę do wszystkich OTA, żeby zmniejszyć u nich pulę.
2. **Reservations pull (OTA → my):** kiedy ktoś zarezerwuje przez OTA, musimy **pobrać** tę rezerwację do naszego systemu i zdjąć pokój z puli lokalnie.

Brak którejkolwiek strony = overbooking.

### 3.4. Latencja i wyścigi (race conditions)

Nawet przy dwukierunkowym API istnieje **okno wyścigu** między sprzedażą na jednym kanale a propagacją informacji do pozostałych. Kluczowe metryki:

- **API (real-time):** propagacja rzędu **sekund** → okno wyścigu małe, akceptowalne.
- **iCal (poll co 2–12 h):** propagacja rzędu **godzin** → okno wyścigu ogromne, realny overbooking.

To dlatego mechanizm synchronizacji jest krytyczny, a nie „nice to have".

### 3.5. Dlaczego nie da się zintegrować bezpośrednio z API Booking.com

Naturalny pomysł „napiszemy własny system i podepniemy się wprost pod API Booking.com" jest **obecnie niewykonalny**:

- Dostęp do **Booking.com Connectivity API** wymaga statusu **certyfikowanego Connectivity Partnera** — program przeznaczony dla **dostawców oprogramowania** (channel managery / PMS), nie dla pojedynczego hotelu. Wymaga m.in. ładowania min. rocznego okna ARI, spełnienia wymogów niezawodności/prędkości sync, obsługi wielu połączonych obiektów.
- **Booking.com aktualnie wstrzymał przyjmowanie nowych connectivity partnerów** (aktualizacja regulaminu) — więc nawet droga certyfikacji jest chwilowo zamknięta.

**Wniosek:** synchronizację z OTA musi pośredniczyć **channel manager (CM)** — gotowy, już certyfikowany dostawca. To jest twarde ograniczenie, wokół którego projektujemy całą architekturę.

### 3.6. Rola channel managera — „single source of truth"

Channel manager to komponent, który:
- trzyma **jedną, autorytatywną** wersję dostępności/cen/restrykcji dla wszystkich typów pokoi,
- jest już **certyfikowanym partnerem** OTA (Booking, Agoda, Expedia, Airbnb…), więc realizuje ARI push i reservations pull za nas,
- udostępnia **API/webhooki** dla naszego własnego silnika rezerwacji bezpośrednich.

Docelowa topologia zawsze wygląda tak (niezależnie od wybranej opcji):

```
        Booking.com   Agoda   portale PL
             \          |         /
              \         |        /
             [ CHANNEL MANAGER ]  ← single source of truth (ARI)
              /         |        \
   Recepcja/PMS   Nasz silnik    (opcjonalnie iCal:
                  bezpośredni     Airbnb itp.)
```

Pytanie projektowe brzmi więc nie „CM czy nie CM", tylko: **czy silnik rezerwacji bezpośrednich bierzemy gotowy (razem z CM), czy budujemy własny i podpinamy go do CM.**

### 3.7. iCal — dlaczego to nie jest pełna synchronizacja

iCal bywa reklamowany jako „darmowa synchronizacja", ale ma zasadnicze ograniczenia, które trzeba jasno zapisać:

| Cecha | API (channel manager) | iCal |
|---|---|---|
| Zakres | dostępność + ceny + restrykcje + rezerwacje | **tylko dostępność (zajęte/wolne)** |
| Aktualizacja | real-time (sekundy) | poll co **2–12 h** |
| Ceny/plany | tak | **nie** |
| Ryzyko overbookingu | niskie | **wysokie** (okno godzinowe) |
| Koszt | abonament CM | ~0 zł |
| Zastosowanie | hotel wielopokojowy | apartament / kilka jednostek |

**Dla 51 pokoi z aktywnym Booking.com iCal jest niewystarczający jako główny mechanizm.** Może pełnić rolę awaryjną/uzupełniającą (np. dla pojedynczego kanału bez API).

---

## 4. Możliwe opcje rozwiązania

### Opcja A — Gotowy silnik rezerwacji + channel manager „w jednym" ⭐ rekomendacja domyślna

Kupujemy zintegrowany produkt (booking engine + CM), osadzamy widget „Zarezerwuj" na obecnej stronie.

```
[Nasza statyczna strona] --embed widget--> [Silnik dostawcy] --+
                                                                | (ten sam dostawca)
                                            [Channel Manager] --+--> Booking / Agoda / ...
```

- **Przykłady/koszty (2026):** Sirvoy Pro ~$54/mc (~220 zł, 0% prowizji od bezpośrednich); Hotres.pl ~150–300 zł/mc (polski, faktury PL, 0% prowizji); Beds24 ~130–220 zł/mc (tani, techniczny); Cloudbeds/Profitroom — wyższa półka / prowizja.
- **Płatności:** zwykle wbudowane (podpinamy konto Przelewy24/Tpay/PayU).
- **Plusy:** najniższy nakład jednorazowy; dostawca gwarantuje sync i chroni przed overbookingiem; szybkie wdrożenie; wsparcie.
- **Minusy:** ograniczona kontrola nad UX; nietypowe scenariusze (pakiet wesele+nocleg, grupy szkolne, faktury pracownicze) mogą się nie zmieścić w gotowym flow; „widget w iframe" bywa wizualnie odklejony od strony.
- **Szczegółowe porównanie konkretnych systemów** (koszty przy 51 pokojach, customizacja, płatności, trudność integracji, rekomendacja dostawcy) → **Załącznik A** na końcu dokumentu.

### Opcja B — Własny silnik rezerwacji bezpośrednich + tani channel manager przez API ✅ jeśli chcemy własny UX

Budujemy **własny frontend/silnik rezerwacji** (nasza marka, nasz UX, własne pakiety), a synchronizację z OTA zleca **channel manager z otwartym API** (np. Beds24 — bogate API + webhooki). CM pozostaje „single source of truth".

```
[Nasza strona + własny silnik] <--API/webhooki--> [Channel Manager (np. Beds24)] --> Booking / Agoda / ...
            |
         [Bramka płatności: Przelewy24 / Tpay]
```

Przepływ:
1. Gość wybiera termin na naszej stronie → silnik pyta CM o realną dostępność/cenę (API).
2. Gość płaci (bramka) → silnik tworzy rezerwację w CM (API).
3. CM natychmiast wypycha zmniejszoną dostępność do wszystkich OTA (ARI push).
4. Rezerwacje z OTA CM przekazuje do nas webhookiem → zapisujemy lokalnie.

- **Koszt stały:** sam CM (~130–220 zł/mc). **Koszt jednorazowy:** duży — budowa UI, koszyka, integracji płatności, panelu, obsługi błędów, testów.
- **Plusy:** pełna kontrola nad UX i danymi gości; obsługa nietypowych pakietów (które hotel realnie ma); poprawna, real-time synchronizacja bez overbookingu (bo robi ją CM).
- **Minusy:** to my utrzymujemy silnik na zawsze; więcej pracy i ryzyka niż gotowiec; różnica w koszcie **stałym** vs gotowiec jest niewielka (i tak płacimy za CM).

**To jest bezpośrednia odpowiedź na pytanie „czy da się mieć własny, tańszy, zsynchronizowany system":** tak — własny silnik bezpośredni + tani CM. „Taniej" dotyczy jednak głównie prowizji (0% od bezpośrednich), a nie kosztu wdrożenia/utrzymania.

### Opcja C — Własny silnik + synchronizacja iCal ⚠️ tylko awaryjnie

Jak Opcja B, ale zamiast płatnego CM używamy darmowego iCal do sync dostępności.

- **Koszt:** ~0 zł stałych.
- **Minusy:** patrz 3.7 — tylko dostępność, opóźnienie 2–12 h, brak sync cen, **wysokie ryzyko overbookingu**. **Niezalecane przy 51 pokojach i aktywnym Booking.** Do rozważenia najwyżej jako uzupełnienie pojedynczego kanału bez API.

### Opcja D — Własny silnik + bezpośrednia integracja z API każdej OTA ❌ odrzucona

Pełny własny stack łączący się wprost z API Booking/Agody.

- **Powód odrzucenia:** wymaga certyfikacji Connectivity Partner (dla vendorów oprogramowania, nie hoteli) — a Booking.com **wstrzymał nabór** nowych partnerów. Praktycznie niewykonalne dla pojedynczego obiektu. Ogromny nakład i utrzymanie.

---

## 5. Płatności

Płatności są ściśle powiązane z systemem rezerwacji, ale **nie są jednym monolitem**. Kluczowa obserwacja projektowa: istnieją **dwa niezależne przepływy pieniędzy**, rządzące się różnymi regułami.

### 5.1. Dwa przepływy płatności

| | Rezerwacja **bezpośrednia** (nasza strona/silnik) | Rezerwacja z **OTA** (Booking / Agoda) |
|---|---|---|
| Kto pobiera płatność | **My** — przez własną bramkę | OTA lub my, zależnie od modelu |
| Prowizja OTA | 0% | ~15% |
| Konfiguracja | bramka wpięta w silnik | model „Payments by Booking.com" albo karta gościa |

Wniosek: **bramka płatności obsługuje głównie kanał bezpośredni.** Przychód z OTA przechodzi w większości poza naszym silnikiem — nasz system tylko *zaciąga* rezerwację (reservations pull, patrz 3.3), a rozliczenie realizuje OTA lub recepcja.

### 5.2. Płatności bezpośrednie — gdzie „siedzi" integracja

Zależy od wybranej opcji silnika (sekcja 4):

- **Opcja A (gotowy silnik):** bramka **wbudowana** — podpinamy konto. Ograniczenie: silnik wspiera konkretne bramki.
  - **Sirvoy** → Stripe, PayPal.
  - **Beds24** → Stripe (rekomendowany) + wiele innych; zgodność SCA/PSD2/3DSecure.
  - **Hotres.pl** (polski) → natywnie **Przelewy24 / Tpay / PayU**.
- **Opcja B (własny silnik):** wpinamy **dowolną** bramkę przez API — pełna dowolność.

> Jeśli zależy nam na **BLIK-u natywnie**: najprościej z polskim silnikiem (Hotres) albo przez Stripe (Stripe obsługuje BLIK). Sirvoy/Beds24 idą przez Stripe.

### 5.3. Bramki płatności — porównanie (rynek PL, 2026)

| Bramka | Aktywacja | Prowizja | Metody | Kiedy sensowna |
|---|---|---|---|---|
| **Przelewy24** | ~1,50 zł | BLIK/przelew ~1,2–1,4% | BLIK, przelewy, karty, Google/Apple Pay, PayPo | domyślna dla PL, najniższy próg |
| **Tpay** | 199 zł | przelew 1,59%+0,39 zł; BLIK 1,78%+0,39 zł | BLIK, przelewy, karty | alternatywa PL |
| **PayU** | 199 zł | BLIK 1,19%+0,09 zł; karty 1,9%+0,25 zł | pełny wachlarz + raty PayPo | duży wolumen |
| **Autopay** | 19 zł (firma) | od 1,19% | BLIK, przelewy, karty | dobre stawki przy wolumenie |
| **Stripe** | 0 zł | ~1,5%+0,25 zł (karty EU); wspiera BLIK | karty, BLIK, Apple/Google Pay | gdy silnik = Sirvoy/Beds24 lub własny stack |

### 5.4. Model — *kiedy* pobieramy płatność (decyzja biznesowa właściciela)

Silniki wspierają wszystkie poniższe; to wybór polityki, nie technologii:

- **Płatność w hotelu (pay-at-hotel)** — 0 zł online; ryzyko no-show.
- **Zaliczka / przedpłata (deposit)** — np. 20–30% przy rezerwacji, reszta na miejscu. Najczęstszy kompromis.
- **Pełna przedpłata** — cała kwota z góry (zwykle taryfy bezzwrotne).
- **Taryfa bezzwrotna** — niższa cena, pełna płatność, brak zwrotu.
- **Gwarancja kartą / pre-autoryzacja** — blokada środków na wypadek no-show (okno autoryzacji ~30 dni).

### 5.5. Płatności z OTA — dwa modele (bez własnej bramki)

- **„Payments by Booking.com" (model merchant):** Booking pobiera od gościa i płaci hotelowi **wirtualną kartą (VCC)** lub przelewem; bierze na siebie chargebacki, fraud, nieudane karty. **Koszt dodatkowy ~3%** za obsługę VCC (poza prowizją ~15%). Wygodne, droższe.
- **„Hotel zarządza płatnością":** dostajemy dane karty gościa / VCC i **sami obciążamy** kartę zgodnie z polityką. Taniej, więcej obsługi i ryzyka.

Te płatności są **poza naszym silnikiem** — decyzja właściciela to wybór jednego z dwóch modeli w extranecie OTA.

### 5.6. Płatności za usługi nie-noclegowe

Hotel ma catering, wesela/bankiety, wypożyczalnię zastawy, imprezy. Nie muszą przechodzić przez silnik noclegowy:

- **Zaliczki na wesela/bankiety** — wysokie kwoty, faktura, zwykle przelew lub **payment link** (Przelewy24/Tpay generują link bez sklepu).
- **Vouchery / bony podarunkowe** — prosty produkt: payment link lub mini-sklep.

### 5.7. Zwroty i anulacje

- **Opcja A (gotowy silnik):** obsługa zwrotów automatyczna wg polityki.
- **Opcja B (własny silnik):** zwroty (`refund`) i logikę polityki anulacji **implementujemy sami** przez API bramki — realny nakład, którego nie wolno pominąć w wycenie.

### 5.8. Zasady „build vs buy" dla płatności

| Aspekt | Rekomendacja |
|---|---|
| Obsługa kart / PCI-DSS | **Zawsze gotowa bramka.** Nigdy własna obsługa danych kart (ryzyko prawne). |
| Integracja bramki | A = wbudowana; B = przez API. |
| Bramka dla PL | **Przelewy24** (BLIK, najniższy próg) — domyślnie. |
| Płatności OTA | Zostawić OTA/CM. Decyzja: „Payments by Booking" (+~3%, wygoda) vs samodzielne VCC (taniej). |
| Zwroty/anulacje | A: automat; B: implementujemy sami. |
| Catering/wesela/vouchery | Payment links z bramki, poza silnikiem noclegowym. |

### 5.9. Rekomendacja płatności

- **Kanał bezpośredni:** jedna bramka PL — **Przelewy24** (BLIK kluczowy dla polskich gości). Domyślny model: **zaliczka 20–30%** przy rezerwacji + taryfa bezzwrotna jako tańsza opcja.
- **OTA:** nie budujemy nic; decyzja właściciela to „Payments by Booking" (wygoda, +~3%) vs samodzielne VCC (taniej).
- **Dobór bramki wg silnika:** Sirvoy/Beds24 → **Stripe** (obsługuje BLIK); Hotres lub własny silnik → **Przelewy24** natywnie.
- **Nigdy nie budujemy obsługi kart samodzielnie** (PCI-DSS) — zawsze gotowa bramka.

---

## 6. Macierz decyzyjna

| Kryterium | A: Gotowy engine+CM | B: Własny + CM (API) | C: Własny + iCal | D: Własny + direct OTA |
|---|---|---|---|---|
| Koszt stały / mc | 130–350 zł | ~130–220 zł (CM) | ~0 zł | — |
| Nakład jednorazowy | mały | duży | średni | b. duży |
| Kontrola nad UX | niska | **pełna** | pełna | pełna |
| Ryzyko overbookingu | **niskie** | **niskie** | wysokie | (n/d) |
| Nietypowe pakiety (wesele+nocleg, grupy) | ograniczone | **tak** | tak | tak |
| Utrzymanie po naszej stronie | minimalne | duże | duże | b. duże |
| Wykonalne w 2026 | tak | tak | tak | **nie** |

---

## 7. Rekomendacja

1. **Kręgosłupem systemu musi być channel manager** — bezpośrednia integracja z OTA jest zamknięta i nieopłacalna dla jednego hotelu.
2. **Domyślnie: Opcja A** (gotowy silnik + CM z 0% prowizji od bezpośrednich, np. Sirvoy lub Hotres) — najniższe ryzyko i utrzymanie, szybkie wdrożenie. Realna oszczędność powstaje z **przeciągania gości na rezerwację bezpośrednią**, a nie z abonamentu.
3. **Opcja B** (własny silnik + tani CM np. Beds24) — wybieramy, jeśli klient chce własny UX i obsługę nietypowych pakietów (wesela, grupy szkolne, faktury pracownicze), których gotowce nie ogarną. Różnica w koszcie stałym jest niewielka; koszt to głównie praca wdrożeniowa.
4. **iCal (Opcja C)** — tylko awaryjnie/uzupełniająco.
5. **Opcja D** — odrzucona.

---

## 8. Kolejne kroki

1. Decyzja klienta: A czy B (czy potrzebne są nietypowe pakiety uzasadniające własny silnik?).
2. Krótka lista CM/silników do demo: Sirvoy, Hotres.pl (A); Beds24 (B).
3. Mapowanie typów pokoi (Classic/Comfort × 2/3/4/5 os.) na typy w CM.
4. Wybór i założenie bramki płatności (Przelewy24/Tpay).
5. PoC osadzenia widgetu (A) lub PoC integracji silnik↔CM↔płatność (B) na obecnej stronie.
6. Szkolenie recepcji z panelu CM.

---

## Załącznik A — Opcja A: szczegółowe porównanie systemów (dobór dostawcy)

Rozwinięcie Opcji A z sekcji 4 — konkretne systemy „gotowy silnik + channel manager", z kosztem **przeliczonym realnie na 51 pokoi** (część cenników skaluje się z liczbą pokoi, więc kwoty „dla małego pensjonatu" tu nie obowiązują).

> Przeliczniki orientacyjne: ~4,3 zł/€, ~4,0 zł/$ (2026). Ceny dostawców bywają indywidualne/niepubliczne — traktować jako rzędy wielkości do potwierdzenia ofertą.

### A.1. Hotres.pl 🇵🇱 — najlepsze dopasowanie do rynku PL

| Aspekt | Szczegóły |
|---|---|
| Model | abonament **roczny**, **0% prowizji** od bezpośrednich |
| Koszt (51 pok.) | cennik indywidualny, realnie **~150–350 zł/mc** (rozliczane rocznie) |
| Wdrożenie | proste, „kilka dni roboczych"; wsparcie PL, faktury PL |
| Funkcje | silnik + channel manager + recepcja w chmurze; ceny/dostępność z jednego panelu |
| Customizacja | wtyczka dopasowywana kolorystycznie do strony — poziom średni (bez wstrzykiwania dowolnego kodu) |
| Płatności | **natywnie Przelewy24, PayU, Dotpay** → pełny **BLIK** |
| Trudność integracji | 🟢 niska |

Największa zaleta dla Strzelca: natywny Przelewy24/BLIK + polski support + 0% prowizji + faktury PL.

### A.2. Beds24 — najtańszy i najbardziej konfigurowalny (techniczny)

| Aspekt | Szczegóły |
|---|---|
| Model | „pay-as-you-grow", per funkcja/pokój; brak umowy terminowej |
| Koszt (51 pok.) | baza €15,90 + 50×€1 = ~€66/mc; + CM €0,55/połączenie → **~€70–85/mc ≈ 300–370 zł/mc** |
| Funkcje | channel manager + booking engine + dynamiczne ceny + automatyzacja; **najlepsze API na rynku** (v2 w 2026) |
| Customizacja | 🥇 **najwyższa** — wstrzykiwanie własnego **JS/CSS/HTML** w cały proces; każdy aspekt konfigurowalny |
| Płatności | **Stripe** (rekomend., auto-pobieranie zaległych i obciążanie kart z OTA), PayPal, Authorize.Net i in. Przelewy24 **nie natywnie** — BLIK przez Stripe |
| Trudność integracji | 🟠 średnia/wysoka — UI „inżynierskie", wymaga konfiguracji |

Największa zaleta: najniższy koszt stały + pełna kontrola nad wyglądem widgetu (spójność z designem strony).

### A.3. Sirvoy — złoty środek (prosty, ładny widget)

| Aspekt | Szczegóły |
|---|---|
| Model | abonament miesięczny wg **planu + liczby pokoi**; 0% prowizji od bezpośrednich |
| Koszt (51 pok.) | plan **Pro** (od $54/mc) skalowany liczbą pokoi → realnie **~$100–160/mc ≈ 400–640 zł/mc** (dokładnie: kalkulator Sirvoy) |
| Funkcje (Pro) | channel manager, profile gości, dostęp zespołowy, faktury, SMS |
| Customizacja | widget konfigurowalny, dopasowanie kolorów — **płycej niż Beds24** |
| Płatności | **Stripe, PayPal** (Stripe = BLIK/karty/Google-Apple Pay). Brak natywnego Przelewy24 |
| Trudność integracji | 🟢 niska (wtyczka WordPress / embed) |

Uwaga: przy 51 pokojach **droższy niż Beds24 i Hotres** — cena rośnie z liczbą pokoi.

### A.4. Cloudbeds — pełne PMS wyższej klasy

| Aspekt | Szczegóły |
|---|---|
| Model | 4 plany (Flex/One/Experience/Enterprise), wycena indywidualna |
| Koszt (51 pok.) | **~$300–500/mc ≈ 1200–2000 zł/mc** + **wdrożenie $500–5000** |
| Funkcje | pełne PMS + channel manager + booking engine + **wbudowane płatności** + raporty |
| Customizacja | dopracowane widgety, mniej kontroli na poziomie kodu |
| Płatności | **Cloudbeds Payments** (wbudowane) + bramki |
| Trudność integracji | 🟠 średnia — onboarding handlowy, opłata wdrożeniowa, cennik nieprzejrzysty |

Werdykt: funkcjonalnie świetny, ale **kosztowo przeszacowany** dla obiektu budżetowego. Overkill.

### A.5. Profitroom 🇵🇱 — premium, model prowizyjny

| Aspekt | Szczegóły |
|---|---|
| Model | hybryda: **abonament + ~3,5% prowizji** od rezerwacji przez BE |
| Koszt (51 pok.) | CM **€69/mc** + integracja PMS **€35/mc** (≈ **450 zł/mc**) + **3,5%** od rezerwacji BE + moduły |
| Funkcje | Booking Engine 360, CM, CRM, marketing automation, loyalty, strony WWW |
| Customizacja | wysoka, marketingowa, szablonowa |
| Trudność integracji | 🟠 średnia/wysoka — onboarding enterprise |

Werdykt: kierowany do hoteli **4–5\*, 30+ pok., resort/spa/MICE**; prowizja 3,5% od bezpośrednich sprzeczna z celem „0% na kanale bezpośrednim". Odpada dla tego profilu.

### A.6. Zbiorcza macierz

| Kryterium | Hotres 🇵🇱 | Beds24 | Sirvoy | Cloudbeds | Profitroom 🇵🇱 |
|---|---|---|---|---|---|
| Koszt/mc (51 pok.) | ~150–350 zł | **~300–370 zł** | ~400–640 zł | ~1200–2000 zł | ~450 zł + **3,5%** |
| Prowizja od bezpośrednich | **0%** | 0% | 0% | 0% | **~3,5%** |
| Wdrożenie | 🟢 łatwe | 🟠 techniczne | 🟢 łatwe | 🟠 z opłatą | 🟠 enterprise |
| Customizacja widgetu | średnia | 🥇 pełna (JS/CSS) | średnia | dobra | wysoka (szablony) |
| Płatności PL / BLIK natywnie | ✅ Przelewy24/PayU/Dotpay | przez Stripe | przez Stripe | wbudowane/Stripe | ✅ (operatorzy PL) |
| Support / faktury PL | ✅ | ❌ | ❌ | ❌ | ✅ |
| Profil docelowy | mały/średni PL | elastyczny/tani | prosty/ładny | wyższa półka | premium 4–5\* |

### A.7. Płatności per system (prowizje i koszty)

Silniki (poza Cloudbeds/Profitroom) **nie doliczają własnej marży** do płatności — płacisz tylko prowizję bramki (osobne konto).

| Bramka (przez który silnik) | Prowizja | Aktywacja | BLIK |
|---|---|---|---|
| Przelewy24 (Hotres natywnie) | BLIK/przelew ~1,2–1,4% | ~1,50 zł | ✅ natywnie |
| PayU / Dotpay (Hotres) | BLIK ~1,19%, karty ~1,9% | 199 zł | ✅ |
| Stripe (Beds24/Sirvoy) | ~1,5% + 0,25 zł (karty EU) | 0 zł | ✅ (przez Stripe) |
| Cloudbeds Payments | wg umowy | — | zależnie |

Dla płatności z **OTA** (osobny przepływ, sekcja 5.5): „Payments by Booking" dokłada **~3%** za obsługę VCC — niezależnie od wybranego silnika.

### A.8. Rekomendacja doboru dostawcy

Profil: 51 pokoi, gość głównie polski i budżetowy (65 zł/os., rating 6,5), silny Booking.com, dopracowany design, cel = 0% na kanale bezpośrednim.

**Dwóch finalistów:**
1. **Hotres.pl** ⭐ — priorytet rynek PL, BLIK i prostota: natywny Przelewy24/BLIK, 0% prowizji, polski support/faktury, szybkie wdrożenie. Najmniej tarcia dla właściciela i gościa.
2. **Beds24** — priorytet najniższy koszt i maksymalna kontrola nad wyglądem widgetu: najtańszy przy 51 pokojach, pełne JS/CSS, ale konfiguracja techniczna po naszej stronie i BLIK przez Stripe.

**Odpadają:** Sirvoy (drożej bez przewagi PL), Cloudbeds (przeszacowany), Profitroom (premium + prowizja).

Rozstrzygnięcie: dla obiektu, gdzie właściciel sam obsługuje system, a goście płacą BLIK-iem — **skłaniamy się ku Hotres**; Beds24 gdy priorytetem jest koszt i spójność wizualna widgetu.

---

## Źródła

- Strzelec Noclegi — Booking.com: https://www.booking.com/hotel/pl/strzelec-noclegi.html
- Wymagania Connectivity Partner — Booking.com: https://connectivity.booking.com/s/partnerprogramme/minimum-requirements
- Booking.com Connectivity API (docs): https://developers.booking.com/connectivity/docs
- iCal vs API sync — Guesty: https://www.guesty.com/blog/booking-airbnb-sync/
- Beds24 — API i widgety: https://beds24.com/booking-widgets.html
- Sirvoy — cennik (Capterra 2026): https://www.capterra.com/p/103570/Sirvoy-Booking-System/
- Hotres.pl — booking engine: https://hotres.pl/booking-engine
- Cennik systemów rezerwacyjnych 2026 — zwiadowca.pl: https://zwiadowca.pl/informacje/systemy-rezerwacyjne-dla-hoteli
- Tabela prowizji — Przelewy24: https://www.przelewy24.pl/oferta/tabela-prowizji-i-oplat
- Beds24 — payment gateway (Stripe, SCA/3DS): https://www.beds24.com/payment-gateway.html
- Sirvoy — Stripe payment methods: https://help.sirvoy.com/stripe-payment-methods
- Payments by Booking.com — FAQ: https://partner.booking.com/en-us/help/policies-payments/payment-products/payments-bookingcom-faqs
- Wirtualne karty OTA (VCC) — ChargeAutomation: https://chargeautomation.com/process-virtual-credit-cards-booking-expedia-automatically/
- Sirvoy — pricing & plans: https://help.sirvoy.com/sirvoy-general/sirvoy-pricing-and-plans
- Beds24 — pricing: https://beds24.com/pricing.html
- Hotres.pl — channel manager: https://hotres.pl/channel-manager
- Cloudbeds — pricing: https://www.cloudbeds.com/pricing/
- Cloudbeds — analiza kosztów (costbench): https://costbench.com/software/hotel-management/cloudbeds/
- Profitroom — channel manager: https://profitroom.com/products/channel-manager/
- Profitroom — HotelMinder: https://www.hotelminder.com/partner=Profitroom
