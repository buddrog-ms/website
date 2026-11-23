# Mar-Buddróg - Strona Internetowa

Statyczna jednostronicowa strona firmy Mar-Buddróg (Marcin Strzesak) - budowa dróg, odwodnienia, roboty ziemne i usługi sprzętowe. HTML + CSS + JavaScript, bez procesu budowania.

Domena docelowa (canonical, sitemap, Open Graph): `https://www.strzesak.info`

## Struktura projektu

```
construction-website-main/
├── index.html      # Cała strona: treść, konfiguracja (CONFIG), skrypty, dane SEO
├── style.css       # Style
├── sitemap.xml     # Mapa strony
├── robots.txt      # Reguły dla robotów + adres sitemap
├── README.md       # Ten plik
├── CHANGELOG.md    # Lista zmian i checklista wdrożeniowa (czytaj przed podmianą strony)
├── .htaccess       # Przekierowania (apex/HTTPS na www, stare /project/* na /#projects) - Apache/cPanel
├── vercel.json     # To samo dla Vercel
├── .cpanel.yml     # Wdrożenie na cPanel (kopiuje index.html, style.css, assets itd.)
├── assets/                                   # Wszystko, co jest wdrażane razem ze stroną
│   ├── images/
│   │   ├── gallery/projectN/                 # 36 prawdziwych zdjęć z budów (karty realizacji + galeria): 600w/1200w/1920w
│   │   ├── services/<nazwa>/                 # 11 grafik usług (wygenerowane AI, poglądowe): 600w/1200w
│   │   ├── hero/                             # Poster hero (1. klatka klipu 1)
│   │   └── branding/                         # Favicon i obraz og:image (te same co na strzesak.info)
│   └── video/hero/                           # Filmy AI w tle hero: road-sequence-01..04 (poziome, desktop) i *-portrait (pionowe 9:16, telefony)
├── utils/                                    # Narzędzia deweloperskie (optimize-images.js, sharp) - nie są wdrażane
└── _archive/                                 # Nieużywane pliki (oryginały zdjęć, stare filmy, realizations/, dummy). Nie jest kopiowany przez .cpanel.yml
```

## Dane kontaktowe (CONFIG)

Telefon, email, adres i osoba kontaktowa są w obiekcie `CONFIG` na górze `index.html` i JavaScript wstawia je do nawigacji oraz sekcji Kontakt. Po zmianie danych zaktualizuj też ręcznie:

- blok JSON-LD (`<script type="application/ld+json">`) w `<head>`,
- adres w osadzonej mapie Google (iframe w sekcji Kontakt),
- statyczne wartości w HTML sekcji Kontakt (są zapasem, gdy JS nie działa).

## Sekcje strony

1. **Nawigacja** - jeden przezroczysty pasek, po przewinięciu ciemny. Logo odświeża stronę główną (`index.html`).
2. **Hero** - pełnoekranowe, z sekwencją 4 filmów AI w tle (tylko na ekranach od 768 px i bez `prefers-reduced-motion`; poza tym widoczne zdjęcie `project2.jpg`) oraz karta ze statystykami.
3. **O nas** - opis firmy i 4 filary.
4. **Usługi** - 11 usług z grafikami `assets/images/services/*/`.
5. **Wybrane realizacje** - 4 karty (`[data-project]`), każda jako album zdjęć ze strzałkami, kropkami, licznikiem i przyciskiem „Powiększ zdjęcia" otwierającym lightbox (GLightbox) bez podpisów.
6. **Galeria** - wszystkie 36 prawdziwych zdjęć (Swiper, siatka rzędów).
7. **Kontakt** - dane, godziny i mapa.

## Film w hero

Cztery pliki w `assets/video/hero/` (kolejność w `index.html`): `road-sequence-01-precise.mp4`, `road-sequence-02-highway-v3.mp4`, `road-sequence-03-drainage-v3.mp4`, `road-sequence-04-roundabout-v4.mp4`. Wszystkie mają rozdzielczość 1920×1088. Skrypt odtwarza je po kolei z przenikaniem 1,5 s i wraca do pierwszego. Filmy są wygenerowane przez AI i mają charakter ilustracyjny - nie przedstawiają realizacji firmy.

## Uruchomienie lokalne

```
python -m http.server 8000
```

Następnie `http://localhost:8000`. Strona korzysta z bibliotek ładowanych z CDN (GLightbox, Swiper, Google Fonts), więc potrzebuje połączenia z internetem.

## SEO

W `<head>` `index.html`: meta description, canonical, Open Graph, Twitter Card, `theme-color` oraz dane strukturalne JSON-LD (`GeneralContractor`) z adresem, współrzędnymi GPS (`geo`), województwem, telefonem, emailem, godzinami, profilem Facebook (`sameAs`) i listą usług. `sitemap.xml` zawiera tylko stronę główną (kotwice `#...` nie należą do sitemap).

## Przed publikacją

- Filmy są już skompresowane (H.264, CRF 29, ok. 63 MB łącznie). Serwer powinien obsługiwać żądania Range (większość hostingów robi to domyślnie).
- Potwierdź liczby w karcie statystyk (500+ projektów, 1200 km) - pochodzą z szablonu i nie są zweryfikowane. „20+ lat doświadczenia" i „100% zadowolonych klientów" ustalił właściciel strony.
- Opisy „Zakres prac" w kartach realizacji i grafiki usług (AI) są poglądowe - sprawdź, czy odpowiadają rzeczywistym pracom firmy.
- Obraz `og:image` to `assets/images/branding/og-image-strzesak.png` (1200x630, ten sam co na strzesak.info; w grafice widnieje napis „MS BUDOWNICTWO”).
- Nieużywane pliki (stare wersje filmów, `dummy`, `header-bg.jpg`, oryginały filmów) leżą w folderze `_archive/` (układ jak dawny `images/`, oryginały zdjęć w `_archive/images/originals/`).
