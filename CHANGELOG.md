# CHANGELOG - Mar-Buddróg (nowa strona vs. obecne strzesak.info)

Ten plik opisuje, co zmieniło się względem obecnej wersji na https://www.strzesak.info oraz co trzeba zrobić przy podmianie strony na hostingu.

## Wersja do publikacji (2026-11-22)

### Zmiany względem starej strony
- Nowy układ jednostronicowy (one-page): nawigacja z podświetlaniem aktywnej sekcji, sekcje O nas / Usługi / Wybrane realizacje / Galeria / Kontakt.
- Hero: sekwencja 4 filmów AI w tle (łącznie ok. 63 MB, H.264, 1920x1088) + poster `images/hero-poster-video.jpg`. Filmy ładują się tylko na ekranach od 768 px i bez `prefers-reduced-motion`. Materiały AI są ilustracyjne, nie przedstawiają prawdziwych realizacji firmy.
- Usługi: 11 usług (jak na starej stronie) z grafikami `images/service-*.jpg` (AI, poglądowe).
- Wybrane realizacje: 4 interaktywne karty-albumy + pełna galeria 36 prawdziwych zdjęć (Swiper + GLightbox, bez podpisów w powiększeniu).
- Statystyki: 20+ lat, 500+ projektów, 1200 km, 100% zadowolonych klientów.
- Zdjęcia: miniatury WebP/JPEG (600w i 1200w) w `<picture>`/`srcset` z `loading="lazy"` zamiast pełnych plików; pełny `1920w.webp` otwiera się dopiero w lightboxie. Ukryte slajdy albumów ładują się po załadowaniu strony lub przy interakcji. Źródła w `images/gallery/projectN/` (zdjęcia realizacji) oraz `images/service-*/` (usługi); poster hero ma wersję `hero-poster-video.webp`. Warianty generuje `utils/optimize-images.js` (sharp).
- Hero na telefonach: klipy wideo grają także poniżej 768 px, z lżejszych wersji 720p `images/road-sequence-*-mobile.mp4` (ok. 2,3-3 MB każda, łącznie ok. 10,7 MB), wskazywanych atrybutem `data-src-mobile`. Na telefonie pierwszy klip startuje sam, kolejne dołączają się chwilę przed przejściem. Klipy nie ładują się przy włączonym `prefers-reduced-motion` ani trybie oszczędzania danych (`saveData`) - wtedy widać statyczny poster. Układ hero na ekranach `< 768 px` został wyważony: wideo zostaje pełnym tłem sekcji (`.hero-bg` z `bottom: 130px` i delikatnym pionowym gradientem), na które naturalnie nachodzą tytuł (w jednej linii), przyciski obok siebie i górna część karty statystyk, przy zachowaniu odsłoniętej górnej strefy kadru.
- Strzałka "wróć na górę" w nowym wyglądzie; kliknięcie w logo przeładowuje stronę na czysty adres `/`.

### Zachowane elementy identyfikacyjne ze starej strony
- Favicon: `images/favicon-ms-strzesak.png`.
- Obraz podglądu linku (og:image 1200x630): `images/og-image-strzesak.png` (na grafice napis "MS BUDOWNICTWO" - tak jak na starej stronie).
- Dane kontaktowe: Marcin Strzesak, Tonia 84, 33-200 Bolesław, +48 534 340 400, m.buddrog@gmail.com, Pon-Pt 8:00-17:00.
- Facebook: https://www.facebook.com/marbuddrog (kafelek w sekcji Kontakt oraz `sameAs` w JSON-LD).
- Stopka: "Strona wykonana przez SouthWay".

### SEO
- Wszystkie adresy (canonical, og:url, og:image, JSON-LD, sitemap.xml, robots.txt) wskazują na `https://www.strzesak.info/` - bo `https://strzesak.info/` na serwerze przekierowuje (301) na wersję z `www`.
- JSON-LD `GeneralContractor`: dodane `addressRegion` (Małopolskie), `geo` (50.2881343, 20.9282717 - odczytane z mapy Google dla adresu Tonia 84), `sameAs` (Facebook), `image` = og-image-strzesak.png.
- `sitemap.xml` (tylko strona główna) i `robots.txt` zaktualizowane.
- `.htaccess` i `vercel.json`: przekierowanie 301 z `/project/*` i `project.html` na `https://www.strzesak.info/#projects`. Usunięte pliki `project.html` i `project/*.html`; `.cpanel.yml` już ich nie kopiuje.

### Co przestaje istnieć po podmianie (stare adresy)
Stara strona miała osobne podstrony realizacji. Nowa jest jednostronicowa, więc te adresy trzeba przekierować (robi to `.htaccess` na cPanel i `vercel.json` na Vercel):
- `/project/modernizacja-drog`
- `/project/odsniezanie`
- `/project/rozbiorka-budynku`
- `/project/transport-materialow`
- `/project/drenaze`

Nie ma też starych katalogów zdjęć (`images/gallery/...`, `images/realizations/...`) ani ikony `images/icons/excavator-logo.png` (celowo pominięta). Starego górnego paska (topbar) z telefonem i mailem też nie ma - dane są w nawigacji i sekcji Kontakt.

## Checklista przy podmianie strony na hostingu
1. Zrób kopię zapasową obecnej strony z serwera.
2. Wdrożenie na cPanel robi `.cpanel.yml` po wypchnięciu na gałąź `production` (kopiuje `index.html`, `style.css`, `robots.txt`, `sitemap.xml`, `.htaccess`, `images/`, `.well-known/`). Przy ręcznym wgraniu pamiętaj o ukrytym pliku `.htaccess` (część klientów FTP go pomija).
3. Sprawdź, czy `.htaccess` działa (hosting musi mieć Apache/LiteSpeed z mod_rewrite/mod_alias): wejdź na `https://www.strzesak.info/project/drenaze` - powinno przekierować na stronę główną (sekcja realizacji). Jeśli hosting to nie Apache (np. nginx), przekierowanie trzeba ustawić w panelu hostingu.
4. Sprawdź `https://www.strzesak.info/sitemap.xml` i `https://www.strzesak.info/robots.txt`.
5. Odtwórz filmy w hero (pliki ~13-20 MB każdy); serwer powinien obsługiwać żądania Range.
6. Google Search Console: wyślij ponownie `https://www.strzesak.info/sitemap.xml` i użyj "Poproś o zaindeksowanie" dla strony głównej.
7. Facebook Sharing Debugger: odśwież podgląd linku (cache starego og:image).
8. Profil Firmy w Google (Mapy): upewnij się, że nazwa, adres, telefon, godziny i adres strony są identyczne jak na stronie.
9. Potwierdź z właścicielem liczby w statystykach (500+ projektów, 1200 km) - nie są zweryfikowane. Opisy "Zakres prac" i grafiki usług (AI) są poglądowe.