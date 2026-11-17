# Limiar — website

Landing page for [Limiar](https://github.com/Jonorusc/limiar), a charge limiter for Apple Silicon MacBooks that works on macOS 27.

Plain HTML, CSS and JavaScript: no framework and no build step. Deployed on Vercel.

## Structure

| Path | What it is |
|---|---|
| `index.html` | The page (semantic HTML, SEO, Open Graph, JSON-LD) |
| `styles.css` | Design tokens, light/dark themes, layout |
| `app.js` | Language switch, GitHub stats, interactive app replica, scroll reveal |
| `i18n.js` | English and Brazilian Portuguese strings |
| `api/github.js` | Vercel Function: stars and latest release, cached for 1 h at the edge |
| `assets/` | Icons and the link preview image |
| `scripts/make-og.swift` | Regenerates `assets/og-image.png` (macOS) |

## Run locally

```bash
python3 -m http.server 4173
```

Open http://localhost:4173. `/api/github` only runs on Vercel; locally the page falls back to plain GitHub links. To run the function too, use `npx vercel dev`.

## Deploy

Import the repository on Vercel with framework preset **Other**. No build command is needed. Optional: add a `GITHUB_TOKEN` environment variable to raise the GitHub API rate limit.

When the production domain is final, update the `canonical`, `og:url` and `og:image` URLs in `index.html`.

## Updating the icon

Copy the new `docs/logo.png` from the app repository to `assets/icon-512.png`, resize it into `icon.png` (256), `apple-touch-icon.png` (180) and `favicon.png` (64), then run `swift scripts/make-og.swift`.

## License

[MIT](LICENSE)
