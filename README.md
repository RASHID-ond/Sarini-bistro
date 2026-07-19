# Sarini Bistro

A premium, dark-themed restaurant website with online ordering, table reservations, and an admin dashboard.

## Architecture

This app is split into three independently hosted pieces:

| Layer | Tech | Hosted on |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | Express (API only) | Render |
| Database + image storage | Supabase (Postgres + Storage) | Supabase |

The backend stores all app data (menu, orders, reservations, settings, notification logs) as a single JSON document in a Supabase Postgres table, and stores uploaded images in a Supabase Storage bucket.

## Features

- Landing page with menu, hero section, and reservations
- Shopping cart and checkout flow, with M-Pesa STK push integration (falls back to a simulator if M-Pesa credentials aren't configured in Settings)
- Order tracking
- Admin panel for managing menu items, orders, reservations, and site settings

## One-time Supabase Setup

1. Create a project at https://supabase.com if you haven't already.
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql` to create the `app_state` table.
3. Go to **Storage** → **New bucket** → name it `images` → toggle **Public bucket** on.
4. Go to **Project Settings → API** and copy your Project URL and `service_role` key (not the `anon` key — the backend needs the service role key to bypass Row Level Security).

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project.
3. Run the backend (in one terminal):
   ```bash
   npm run dev
   ```
4. Run the frontend (in a second terminal):
   ```bash
   npm run dev:client
   ```
5. Open the Vite dev server URL shown in the terminal (typically `http://localhost:5173`).

## Deploying

**Backend → Render**
- Build command: `npm install && npm run build:server`
- Start command: `npm run start`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `FRONTEND_URL` (your Vercel URL, for CORS), `APP_URL` (your Render URL)

**Frontend → Vercel**
- Framework preset: Vite
- Environment variable: `VITE_API_URL` set to your Render backend URL

## Project Structure

- `server.ts` — Express API server (menu, orders, reservations, analytics, M-Pesa, image upload)
- `src/` — React frontend (components, pages, styles)
- `src/config.ts` — reads `VITE_API_URL` so the frontend knows where the backend lives
- `supabase/schema.sql` — one-time SQL to set up the Supabase table
