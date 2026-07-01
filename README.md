# Strzelec Wrocław – Statyczna strona internetowa

Nowoczesna, responsywna strona statyczna dla obiektu Strzelec Wrocław.  
Działa bez procesu build – wystarczy otworzyć `index.html` lub wgrać pliki na FTP.

---

## Struktura plików

```
/
├── index.html               ← Strona główna
├── pokoje.html              ← Noclegi i pokoje
├── restauracja.html         ← Restauracja
├── catering.html            ← Catering
├── wesela-i-bankiety.html   ← Wesela i bankiety
├── imprezy-plenerowe.html   ← Imprezy plenerowe
├── galeria.html             ← Galeria zdjęć
├── o-strzelcu.html          ← O obiekcie
├── kontakt.html             ← Kontakt i formularz
├── praca.html               ← Rekrutacja
├── assets/
│   ├── css/style.css        ← Główny plik stylów (JEDEN plik)
│   ├── js/main.js           ← Główny plik JavaScript (JEDEN plik)
│   ├── img/
│   │   ├── hero/            ← Zdjęcia do sekcji hero
│   │   ├── pokoje/          ← Zdjęcia pokoi
│   │   ├── restauracja/     ← Zdjęcia restauracji
│   │   ├── wesela/          ← Zdjęcia sali weselnej
│   │   ├── catering/        ← Zdjęcia cateringu
│   │   ├── galeria/         ← Zdjęcia galerii
│   │   └── source/          ← Oryginalne pobrane zdjęcia
│   ├── menu/
│   │   └── menu.pdf         ← Menu restauracji (PDF)
│   └── icons/               ← Ikony (opcjonalnie)
├── scripts/
│   ├── download-images.js   ← Skrypt do pobierania zdjęć
│   └── optimize-images.js   ← Skrypt do optymalizacji do WebP
└── README.md
```

---

## Jak uruchomić stronę lokalnie

**Opcja A – bezpośrednio w przeglądarce:**
1. Otwórz folder projektu
2. Kliknij dwukrotnie na `index.html`

**Opcja B – przez prosty serwer HTTP (zalecane):**
```bash
# Python 3
python3 -m http.server 8080
# Następnie otwórz: http://localhost:8080

# Node.js (npx)
npx serve .
```

---

## Jak podmienić zdjęcia

### Metoda 1 – ręcznie (najprostsza)
1. Wgraj zdjęcia do odpowiednich katalogów:
   - `assets/img/hero/` – zdjęcia do banerów na górze stron
   - `assets/img/pokoje/` – zdjęcia pokoi
   - `assets/img/restauracja/` – zdjęcia restauracji
   - `assets/img/wesela/` – zdjęcia sali weselnej
   - `assets/img/catering/` – zdjęcia cateringu
   - `assets/img/galeria/` – zdjęcia do galerii
2. W kodzie HTML znajdź komentarze `<!-- Docelowo: <img src=... -->` i odkomentuj linie z `<img>`
3. Usuń lub ukryj element `<div class="card-img-placeholder">` lub `<div class="hero-placeholder">`

### Metoda 2 – automatycznie (pobieranie ze starej strony)
```bash
# Krok 1: Pobierz listę mediów z WordPress API
mkdir -p assets/img/source
curl "https://strzelecwroclaw.pl/wp-json/wp/v2/media?per_page=100" \
  -o assets/img/source/media.json

# Krok 2: Uruchom skrypt pobierania
node scripts/download-images.js

# Krok 3 (opcjonalnie): Zoptymalizuj do WebP
npm install sharp
node scripts/optimize-images.js
```

### Metoda 3 – wget (pobieranie całej strony)
```bash
mkdir -p assets/img/source
wget \
  --recursive --level=3 --no-parent --page-requisites \
  --adjust-extension --convert-links \
  --domains strzelecwroclaw.pl \
  --accept jpg,jpeg,png,webp,svg,gif \
  --directory-prefix=assets/img/source \
  https://strzelecwroclaw.pl/
```

---

## Jak zmienić numer telefonu

Numer telefonu pojawia się w wielu miejscach. Szybka metoda przez wyszukiwanie:

```bash
# Na macOS/Linux – znajdź wszystkie wystąpienia
grep -rn "733123621\|733 123 621" *.html

# Zamień wszędzie (macOS)
sed -i '' 's/733 123 621/NOWY NUMER/g' *.html
sed -i '' 's/+48733123621/+48NOWYNUMER/g' *.html

# Zamień wszędzie (Linux)
sed -i 's/733 123 621/NOWY NUMER/g' *.html
sed -i 's/+48733123621/+48NOWYNUMER/g' *.html
```

Lub ręcznie – w każdym pliku HTML szukaj fragmentu `tel:+48733123621` i zastąp nowym numerem.

**Ważne:** Numerów są dwa rodzaje:
- `href="tel:+48733123621"` – do połączenia z telefonu (format międzynarodowy bez spacji)
- Tekst wyświetlany `733 123 621` – widoczny dla użytkownika

---

## Jak podmienić menu PDF restauracji

1. Przygotuj aktualne menu w formacie PDF
2. Zmień nazwę pliku na `menu.pdf`
3. Wgraj plik do katalogu `assets/menu/`, zastępując stary plik

Link do menu w kodzie restauracji.html wskazuje na `assets/menu/menu.pdf` – nie musisz zmieniać kodu HTML.

---

## Jak zmienić treść menu nawigacyjnego

Menu (header i footer) jest powielone we wszystkich 10 plikach HTML. Aby zmienić np. nazwę pozycji menu:

1. Otwórz każdy plik HTML
2. Znajdź sekcję oznaczoną `<!-- HEADER START -->` ... `<!-- HEADER END -->`
3. Zmień odpowiedni link

**Wskazówka:** Użyj funkcji "Znajdź i zamień" w edytorze tekstu (Ctrl+H lub Cmd+H) dla wszystkich plików jednocześnie.

---

## Jak dodać nową podstronę

1. Skopiuj dowolny istniejący plik HTML, np. `o-strzelcu.html` → `nowa-strona.html`
2. Zmień `<title>`, `<meta name="description">` i treść między `<main>` tagami
3. Dodaj link do nowej strony w sekcji `<!-- HEADER START -->` w **każdym** pliku HTML
4. Dodaj link do nowej strony w sekcji `<!-- FOOTER START -->` tam, gdzie to potrzebne

---

## Jak aktywować formularz kontaktowy (Formspree)

1. Zarejestruj się na [formspree.io](https://formspree.io/)
2. Utwórz nowy formularz i skopiuj swój identyfikator (np. `xyzabc12`)
3. Otwórz `kontakt.html`
4. Znajdź `<form ... action="#">` i zmień `action` na:
   ```html
   <form action="https://formspree.io/f/xyzabc12" method="POST">
   ```
5. Formularz będzie teraz wysyłać e-maile na Twój adres

---

## Jak wrzucić stronę na hosting FTP

1. Połącz się z serwerem FTP (program: FileZilla lub podobny)
2. Wgraj **cały zawartość** folderu projektu na serwer (do folderu `public_html/` lub `www/`)
3. Sprawdź, czy strona działa pod domeną

**Uwaga:** Nie musisz wgrywać folderu `scripts/` ani `openspec/` – są to narzędzia developerskie.

Minimalne pliki do wgrania:
```
*.html
assets/css/style.css
assets/js/main.js
assets/img/
assets/menu/menu.pdf
```

---

## Jak zaktualizować rok w copyright

Rok w stopce jest automatycznie aktualizowany przez JavaScript (`main.js` → `updateCopyrightYear()`). Nie musisz go zmieniać ręcznie.

---

## Dane kontaktowe obiektu

- **Adres:** ul. Świątnicka 36, 52-018 Wrocław
- **Telefon 1:** 733 123 621
- **Telefon 2:** 733 123 622

---

## Uwagi techniczne

- Strona nie wymaga serwera ani Node.js do działania – tylko przeglądarka
- Skrypty `scripts/` wymagają Node.js tylko do jednorazowego pobierania/optymalizacji zdjęć
- Google Fonts (Inter + Playfair Display) ładowane są z CDN – wymagają połączenia z internetem
- Galeria i lightbox działają bez zewnętrznych bibliotek JavaScript
- Formularz kontaktowy wymaga podłączenia Formspree lub własnego backendu
