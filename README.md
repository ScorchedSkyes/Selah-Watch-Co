[README.md](https://github.com/user-attachments/files/30024887/README.md)
# Selah Watch Co. — Website

Marketing site for **Selah Watch Co.**, a family business run by three brothers (Kevin, Ricky, and Kris) who buy and resell watches — vintage to modern, entry level to luxury, with Japanese and Swiss movements. Sales currently happen primarily through live streams on Whatnot.

**Live site:** [www.selahwatches.com](https://www.selahwatches.com)

*"Selah — to pause and reflect."*

## Site Structure

Single-page static site with these sections:

| Section | Purpose |
|---|---|
| Hero | Brand banner (watch emblem + Selah wordmark) with calls to action |
| The Collection | Categories carried: Modern Luxury, Vintage Finds, Entry to Mid |
| What We Carry | Buy/resell positioning — all eras, all budgets, Japanese & Swiss movements |
| Sell a Watch | Form for visitors to request an offer on their watch |
| About Us | The three brothers' story and the Whatnot live-stream selling |
| Buy from Selah | Inquiry form for visitors looking for a specific watch |

## Files

```
├── index.html          # All page markup
├── css/styles.css      # Full design system (navy + champagne gold theme)
├── js/main.js          # Nav, scroll reveals, form submission
├── assets/
│   ├── banner.png      # Brand banner (source image, star removed)
│   ├── logo-clear.png  # Banner with background removed (used in hero)
│   └── bg-texture.jpg  # Page background texture derived from banner
├── scripts/
│   └── remove-bg.js    # Regenerates logo-clear.png from banner.png
└── CNAME               # Custom domain for GitHub Pages
```

## Design Theme

Matched to the brand banner:

- **Colors:** deep navy (`#0e192a`), champagne gold (`#c9a96e` / `#dfc28a`), silver accents
- **Fonts:** Cormorant Garamond (display), Montserrat (body) — via Google Fonts
- **Style:** soft gradients and feathered edges throughout — no hard lines. Glassy panels with faint gold hairlines, gentle hover lifts, scroll-reveal animations
- Fully responsive with mobile nav, safe-area (notch) support, and reduced-motion support

## Contact Forms

Both forms submit to [Web3Forms](https://web3forms.com) — no backend required. Submissions arrive by email with distinct subjects:

- **Sell a Watch** → subject "Sell Request — Selah Watch Co." (name, email, phone, brand/model, era, movement, condition)
- **Buy Inquiry** → subject "Buy Inquiry — Selah Watch Co." (name, email, category, message)

The access key lives in hidden inputs in `index.html`. A hidden honeypot checkbox (`botcheck`) filters bot spam. The customer's email arrives as reply-to, so you can respond directly from your inbox.

## Local Development

No build step. Serve the folder with any static server:

```bash
npx serve -l 5500 .
```

Then open http://localhost:5500. (Opening `index.html` directly also works, including form submissions.)

## Regenerating the Logo Cutout

If `assets/banner.png` changes, rebuild the transparent hero logo:

```bash
npm install        # installs sharp (first time only)
node scripts/remove-bg.js
```

This removes the navy background, preserves the watch-face emblem intact (including the outer ring), and feathers the rim so it blends into the page. Output: `assets/logo-clear.png`.

## Deployment

Hosted on **GitHub Pages** with the custom domain in `CNAME`. Deploy by pushing to `main`:

```bash
git add .
git commit -m "Describe your change"
git push
```

Changes go live within a couple of minutes.
