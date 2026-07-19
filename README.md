# Sarini Bistro

A premium, dark-themed restaurant website with online ordering, table reservations, and an admin dashboard.

## Features

- Landing page with menu, hero section, and reservations
- Shopping cart and checkout flow
- Order tracking
- Admin panel for managing menu items and orders
- Local JSON-based data storage (no external database required)

## Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1. Install dependencies:
```bash
   npm install
```
2. Copy the example environment file and adjust if needed:
```bash
   cp .env.example .env.local
```
3. Run the app in development mode:
```bash
   npm run dev
```
4. Open the app in your browser at the URL shown in the terminal (typically `http://localhost:3000`).

## Build for Production

```bash
npm run build
npm run start
```

## Project Structure

- `server.ts` — Express server, API routes, and JSON-file data storage
- `src/` — React frontend (components, pages, styles)
- `data/db.json` — local data store for menu items and orders
- `uploads/` — uploaded images (menu items, etc.)
