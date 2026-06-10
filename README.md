# kncn23.github.io

Personal portfolio website of **Ata Kaan Can Olcay** — bilingual (English / Türkçe).

🔗 **Live:** https://kncn23.github.io

## Features

- 🌐 Language switcher (EN / TR) with browser-language auto-detection, persisted in `localStorage`
- 🎨 Dark, responsive design — pure HTML/CSS/JS, no build step, no frameworks
- ⭐ Live star counts fetched from the GitHub API (best-effort, degrades gracefully)
- 🗂️ Filterable project grid: Embedded & Systems, AI & ML, Security & Crypto, Optimization, Web & Backend, Games

## Structure

```
index.html          # single-page layout
assets/style.css    # all styles
assets/script.js    # i18n dictionary, project data, filters, GitHub API
```

## Running locally

Just open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
```
