# Presentations

[![Build Status](https://github.com/butlerx/presentation/actions/workflows/static.yml/badge.svg)](https://github.com/butlerx/presentation/actions)
[butlerx.github.io/presentation](https://butlerx.github.io/presentation)

---

## Overview

This repository hosts slide decks for talks authored by Cian Butler, written in
Markdown and compiled to web presentations using
[Eleventy (11ty)](https://www.11ty.dev/) and [reveal.js](https://revealjs.com/).
It supports easy theming and deployment to GitHub Pages.

## Repository Structure

```
content/
  slides/                   # All markdown files (one per presentation)
  _includes/themes/         # Custom Reveal.js themes (CSS & assets)
  _includes/                # Eleventy partials/layouts
  index.html                # Homepage: lists all discovered presentations
eleventy.config.js          # Main Eleventy configuration
...                        # CI/CD, config, and supporting files
_site/                     # (auto-generated) Built static site output
```

## How Presentations Work

- **Each presentation is a Markdown file located in `content/slides/`.**
- **Frontmatter (`---`) defines metadata:**
  - `title`, `author`, `date`, `description`, optionally `slideOptions.theme`.
- **Eleventy automatically discovers and lists all slides** on the homepage
  (`content/index.html`).
- **Each slide within a presentation is separated by `---`.**
- **Images and other assets** may be referenced directly and are processed by
  11ty.

### Example Presentation Frontmatter

```markdown
---
title: My New Talk
author: Cian Butler
date: 2025-01-01
description: My awesome new deck
slideOptions:
  theme: redbrick # Match a theme in content/_includes/themes/
---

# Welcome

## First slide content

# Next Slide

More content here
```

## Theming

- **Themes are simple CSS files** in `content/_includes/themes/` (e.g.,
  `redbrick.css`).
- **To use a theme**, specify its name (without `.css`) in `slideOptions.theme:`
  in your presentation's frontmatter.
- **To create a new theme:**
  1. Copy or create a new CSS file in `content/_includes/themes/`, e.g.
     `mytheme.css`.
  2. Reference it in your presentation:
     ```yaml
     slideOptions:
       theme: mytheme
     ```
- SVG or PNG assets (logos, backgrounds) can go in the same folder. Themes and
  images are copied into the output at build time.

## Configuration & Customization

- **Main Eleventy config:** `eleventy.config.js`
  - Points input to `content/`, output to `_site/`.
  - Adds plugins: Reveal.js, image handling, base HTML, and bundling.
- **Reveal.js plugin config:** `eleventy.config.reveal.js`
  - Ensures custom themes and reveal.js assets are available in the output.
  - Uses Markdown-It with Reveal.js for slide parsing and features.
- **Images:** Shortcode support via `@11ty/eleventy-img` for optimized
  responsive images.

## Running Locally

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Apple Silicon (M1/M2):** If you hit errors with `sharp`, run:
   ```sh
   rm -rf node_modules package-lock.json pnpm-lock.yaml
   pnpm install
   pnpm approve-builds # (select "sharp")
   npm rebuild sharp
   ```
3. **Start dev server (with live reload):**
   ```sh
   pnpm start
   ```
   _Site appears at http://localhost:8080/. Browse all talks on the homepage._
4. **Build static output (for deploy):**
   ```sh
   pnpm build
   ```
5. **Format code:**
   ```sh
   pnpm fmt
   ```

## Adding a Presentation

1. **Create a markdown file** in `content/slides/` (e.g., `amazing-talk.md`).
2. **Add a frontmatter block:**
   - Set title, date, author, optional theme, and description.
3. **Write your slides:**
   - Separate each slide with `---`.
   - Use Markdown, HTML, or embed code, as Reveal.js supports.
4. **Refresh the homepage** (on dev server) to verify it appears. Each talk gets
   a direct link.

## Creating or Modifying a Theme

1. **Create a CSS file** under `content/_includes/themes/` (e.g.,
   `customtheme.css`).
2. **Reference it** in your markdown's `slideOptions.theme`.
3. **Add logo/images** (SVG/PNG) in the same dir if needed; reference from your
   CSS.
4. **Custom themes will be automatically included** in the built Reveal assets.

---

## Deployment

- **Automated via GitHub Actions!**
- **Process:**
  - Triggers on any push to `main` or `master`.
  - Workflow: checks out the code, installs (`pnpm install`), builds
    (`pnpm build`), and uploads the `_site/` directory to GitHub Pages.
  - No manual action is needed; deployment occurs automatically after each push.
- **View the published site at:**  
  [https://butlerx.github.io/presentation](https://butlerx.github.io/presentation)

---

## Contributing

1. Fork & clone the repo.
2. Install dependencies with `pnpm install`.
3. Add or edit a markdown file in `content/slides/` or a theme in
   `content/_includes/themes/`.
4. Test locally (`pnpm start`).
5. Open a pull request!

---

## Author & License

**Author:** Cian Butler  
GitHub: [@butlerx](https://github.com/butlerx) ·
[Personal Site](https://cianbutler.ie)

**License:** MIT

---

## Helpful Links

- [Eleventy documentation](https://www.11ty.dev/docs/)
- [reveal.js docs](https://revealjs.com/)
- [sharp image plugin](https://sharp.pixelplumbing.com/)

_This project automatically generates a homepage listing all slide decks at_
[https://butlerx.github.io/presentation](https://butlerx.github.io/presentation)
