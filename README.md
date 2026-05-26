# Fruit Dojo

A playful fruit-slicing browser game with a katana cursor, combos, bombs, and clean AI toy demo polish.

Move your mouse or finger across the canvas to slash fruit, dodge bombs, and chain combos before time runs out. A global "Games Played" counter is backed by a Cloudflare Pages Function + KV.

## Develop

```bash
npm install
npm run dev      # start the Vite dev server
npm test         # run the vitest suite
npm run lint     # eslint
npm run build    # production build
```

## Deploy to Cloudflare Pages

This project is configured for Cloudflare Pages with `wrangler.toml`:

- project name: `fruit-dojo`
- build output: `dist`
- Pages Function: `functions/api/plays.js`
- KV binding: `FRUIT_DOJO_KV`

Deploy with:

```bash
npm run deploy
```
