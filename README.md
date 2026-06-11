<div align="center">

<a href="https://kncn23.github.io"><img src="assets/readme-banner.svg" alt="kncn23.github.io — personal portfolio" width="100%"></a>

# kncn23.github.io

**Personal portfolio of [Ata Kaan Can Olcay](https://github.com/KNCn23)** — Computer Engineering @ Başkent University
Embedded systems · Edge AI · Systems programming · Optimization

[![Live](https://img.shields.io/badge/live-kncn23.github.io-58e6d9?style=flat-square&labelColor=0a0e14)](https://kncn23.github.io)
[![Deploy](https://img.shields.io/github/deployments/KNCn23/KNCn23.github.io/github-pages?style=flat-square&label=pages&labelColor=0a0e14&color=7c8cff)](https://github.com/KNCn23/KNCn23.github.io/deployments)
[![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-58e6d9?style=flat-square&labelColor=0a0e14)](#-structure)
[![Dependencies](https://img.shields.io/badge/dependencies-0-7c8cff?style=flat-square&labelColor=0a0e14)](#-running-locally)

**[Visit the site →](https://kncn23.github.io)**

</div>

---

## ✨ Highlights

- 🌐 **Bilingual (EN / TR)** — language switcher with browser-language auto-detection, choice persisted in `localStorage`
- 🎨 **Hand-crafted dark design** — pure HTML/CSS/JS; no frameworks, no build step, zero dependencies
- ⭐ **Live GitHub data** — star counts and repo stats fetched from the GitHub API at runtime; degrades gracefully when offline or rate-limited
- 🗂️ **Filterable project grid** — Embedded & Systems · AI & ML · Security & Crypto · Optimization · Web & Backend · Games
- 🧵 **Scroll spine & rail** — animated SVG path that follows your reading progress through the page
- 🔍 **SEO-ready** — sitemap, robots.txt, Open Graph card, semantic markup

## 🎨 Design language

The whole site runs on a small set of CSS custom properties:

| | Token | Hex | Role |
|---|---|---|---|
| ![#0a0e14](https://placehold.co/14x14/0a0e14/0a0e14.png) | `--bg` | `#0a0e14` | Page background |
| ![#121a28](https://placehold.co/14x14/121a28/121a28.png) | `--bg-card` | `#121a28` | Cards & panels |
| ![#1f2a3c](https://placehold.co/14x14/1f2a3c/1f2a3c.png) | `--border` | `#1f2a3c` | Hairlines & borders |
| ![#d6e2f0](https://placehold.co/14x14/d6e2f0/d6e2f0.png) | `--text` | `#d6e2f0` | Body text |
| ![#8b9bb4](https://placehold.co/14x14/8b9bb4/8b9bb4.png) | `--text-dim` | `#8b9bb4` | Secondary text |
| ![#58e6d9](https://placehold.co/14x14/58e6d9/58e6d9.png) | `--accent` | `#58e6d9` | Primary accent (teal) |
| ![#7c8cff](https://placehold.co/14x14/7c8cff/7c8cff.png) | `--accent-2` | `#7c8cff` | Secondary accent (periwinkle) |

**Typography:** [Inter](https://fonts.google.com/specimen/Inter) for UI · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for code and accents

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
