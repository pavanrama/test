# QuickClone

A responsive, single-page marketing website **inspired by** the QuickBooks
homepage (`https://quickbooks.intuit.com/`). It recreates the look and feel of a
modern accounting/finance SaaS landing page — green brand theme, sticky nav,
hero with a dashboard mockup, product cards, alternating feature sections,
pricing tiers, testimonials, and a footer.

> **Disclaimer:** This is an educational clone built with original copy and
> assets. It is **not affiliated with, endorsed by, or connected to Intuit or
> QuickBooks**. All product names and trademarks belong to their respective
> owners.

## Features

- Pure **HTML, CSS, and vanilla JavaScript** — no build step, no dependencies.
- Fully **responsive** (desktop, tablet, mobile) with a slide-down mobile menu.
- **Sticky header** with scroll shadow.
- **Reveal-on-scroll** animations via `IntersectionObserver`.
- Inline **SVG icons / data-URIs** only (no binary image assets).
- Respects `prefers-reduced-motion`.

## Project structure

```
.
├── index.html      # Page markup
├── css/
│   └── styles.css  # All styles + responsive rules
├── js/
│   └── main.js     # Mobile nav, scroll header, reveal animations
└── README.md
```

## Run locally

No build tools required. Either open `index.html` directly in a browser, or
serve it for best results:

```bash
# Python 3
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

## Sections

1. Promo utility bar
2. Sticky header / navigation
3. Hero with animated dashboard mockup
4. Trust / logo bar
5. Products grid
6. Alternating feature highlights
7. Stats band
8. Pricing tiers
9. Testimonials
10. Call-to-action
11. Footer
