<div align="center">

<a href="https://kncn23.github.io"><img src="assets/readme-banner.svg" alt="kncn23.github.io — personal portfolio" width="100%"></a>

# kncn23.github.io

**Personal portfolio of [Ata Kaan Can Olcay](https://github.com/KNCn23)** — Computer Engineering @ Başkent University
Embedded systems · Edge AI · Systems programming · Optimization

[![Live](https://img.shields.io/badge/live-kncn23.github.io-c24c1b?style=flat-square&labelColor=14161a)](https://kncn23.github.io)
[![Deploy](https://img.shields.io/github/deployments/KNCn23/KNCn23.github.io/github-pages?style=flat-square&label=pages&labelColor=14161a&color=c24c1b)](https://github.com/KNCn23/KNCn23.github.io/deployments)
[![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-c24c1b?style=flat-square&labelColor=14161a)](#-structure)
[![Dependencies](https://img.shields.io/badge/dependencies-0-c24c1b?style=flat-square&labelColor=14161a)](#-running-locally)

**[Visit the site →](https://kncn23.github.io)**

</div>

---

## ✨ Highlights

- 🌐 **Bilingual (EN / TR)** — language switcher with browser-language auto-detection, choice persisted in `localStorage`
- 🎨 **Hand-crafted datasheet design** — paper ground, hairline rules and one signal colour; pure HTML/CSS/JS, no frameworks, no build step, zero dependencies
- ⭐ **Live GitHub data** — star counts and repo stats fetched from the GitHub API at runtime; degrades gracefully when offline or rate-limited
- 🗂️ **Filterable project grid** — Embedded & Systems · AI & ML · Security & Crypto · Optimization · Web & Backend · Games
- 🧵 **Scroll spine & rail** — animated SVG path that follows your reading progress through the page
- 🔍 **SEO-ready** — sitemap, robots.txt, Open Graph card, semantic markup

## 🎨 Design language

The whole site runs on a small set of CSS custom properties:

The page is laid out like an electronics datasheet: paper ground, hairline rules,
square corners, parameter tables instead of floating cards, and a single signal
colour used only where something is live or selected.

| | Token | Hex | Role |
|---|---|---|---|
| ![#f6f3ec](https://placehold.co/14x14/f6f3ec/f6f3ec.png) | `--paper` | `#f6f3ec` | Page ground |
| ![#fffdf8](https://placehold.co/14x14/fffdf8/fffdf8.png) | `--paper-2` | `#fffdf8` | Panels & plates |
| ![#f1ede3](https://placehold.co/14x14/f1ede3/f1ede3.png) | `--tint` | `#f1ede3` | Figure backgrounds |
| ![#14161a](https://placehold.co/14x14/14161a/14161a.png) | `--ink` | `#14161a` | Headings, frames, inverted bands |
| ![#3a3d44](https://placehold.co/14x14/3a3d44/3a3d44.png) | `--body` | `#3a3d44` | Body text |
| ![#6b6459](https://placehold.co/14x14/6b6459/6b6459.png) | `--muted` | `#6b6459` | Labels & secondary text |
| ![#d8d2c6](https://placehold.co/14x14/d8d2c6/d8d2c6.png) | `--rule` | `#d8d2c6` | Hairlines |
| ![#c24c1b](https://placehold.co/14x14/c24c1b/c24c1b.png) | `--accent` | `#c24c1b` | Signal colour |

**Typography:** [IBM Plex Sans Condensed](https://fonts.google.com/specimen/IBM+Plex+Sans+Condensed) for headlines · [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) for body · [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) for labels, codes and parameters

## 🗂️ Structure

```
.
├── index.html             # single-page layout — all sections
├── assets/
│   ├── style.css          # design tokens + all styles
│   ├── script.js          # i18n dictionary, project data, filters, GitHub API, scroll spine
│   ├── og-image.png       # social preview card
│   └── cv/                # downloadable CV (PDF)
├── robots.txt
└── sitemap.xml
```

Everything is data-driven from [`assets/script.js`](assets/script.js): the `I18N` dictionary holds every string in both languages, and `FEATURED` / `PROJECTS` arrays feed the project cards — adding a project is a single array entry.

## 🚀 Running locally

No build step — clone and serve:

```bash
git clone https://github.com/KNCn23/KNCn23.github.io.git
cd KNCn23.github.io
python3 -m http.server 8000   # → http://localhost:8000
```

…or just open `index.html` in a browser.

## 📬 Contact

<div align="center">

[**GitHub**](https://github.com/KNCn23) · [**LinkedIn**](https://www.linkedin.com/in/ata-kaan-can-olcay-0154a2208/) · [**CV**](assets/cv/Ata-Kaan-Can-Olcay-CV.pdf)

<sub>Built with plain HTML, CSS and JS — no frameworks were harmed in the making of this site.</sub>

</div>
