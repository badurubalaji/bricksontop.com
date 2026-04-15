# bricksontop.com

Boutique Bengaluru real-estate investment site — static, GitHub-Pages deployable.

## Stack
- Static HTML · CSS · Vanilla JS
- Data-driven (projects + investors in `data/*.json`)
- No build step, no dependencies

## Local preview
```bash
cd bricksontop.com
python3 -m http.server 8080
# http://localhost:8080
```

## Structure
```
bricksontop.com/
├── index.html
├── styles.css
├── script.js
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── CNAME                     # bricksontop.com
├── data/
│   ├── projects.json
│   └── investors.json
├── assets/
│   ├── favicon.svg
│   ├── icon-192.svg
│   ├── icon-512.svg
│   ├── logo.svg
│   └── og-image.svg
└── README.md
```

## SEO coverage
- Unique `<title>`, description, canonical
- Open Graph + Twitter Card
- JSON-LD: `RealEstateAgent` + `WebSite`
- `sitemap.xml`, `robots.txt`
- `site.webmanifest` (PWA-ready) with shortcuts
- Geo meta tags (IN-KA, Bengaluru)
- Apple touch icon + theme-color (light + dark)

## Before launch — replace
- [ ] `REPLACE_WITH_YOUR_FORM` → Google Form URL in `#enquire`
- [ ] Phone `+91 80 4000 2826` → real studio line
- [ ] Email `invest@bricksontop.com` → real inbox
- [ ] LLPIN / GSTIN / K-RERA numbers → real registrations
- [ ] Address (Ashford Chambers placeholder)
- [ ] Generate PNG versions of og-image + favicons if you want broader compatibility (all social crawlers support SVG, but PNG is safer)
- [ ] Real project photography (currently Unsplash placeholders)
