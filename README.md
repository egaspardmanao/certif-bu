# 🏊‍♂️🚴‍♂️🏃‍♂️ Tri Club — Calendrier de saison

Application web open source pour partager et suivre les triathlons d'une saison au sein d'un club.

## Fonctionnalités

- 🗺️ **Carte de France interactive** avec marqueurs colorés par format
- 📋 **Liste triable** par date (mois) ou par format
- 🔍 **Filtre par format** : XS, S, M, L, XL, XXL
- ➕ **Ajout d'événement** via formulaire (géolocalisation automatique)
- 👥 **Inscription des participants** avec choix du format
- 💬 **Zone commentaire** : covoit, hébergement, dates d'inscription…
- 📱 **Lien WhatsApp** pour l'organisation de chaque event

## Stack technique

| Composant | Techno |
|-----------|--------|
| Frontend | React + Vite + Tailwind CSS |
| Carte | Leaflet.js (OpenStreetMap) |
| Base de données | Supabase (Postgres) |
| Déploiement | Vercel |
| Code source | GitHub |

## Installation locale

```bash
git clone https://github.com/TON_USERNAME/tri-club-calendar
cd tri-club-calendar
npm install
cp .env.example .env
# Remplir .env avec tes clés Supabase
npm run dev
```

## Mise en place Supabase

1. Créer un compte sur [supabase.com](https://supabase.com) (gratuit)
2. Nouveau projet → noter l'URL et la clé `anon`
3. Aller dans **SQL Editor** et coller le contenu de `supabase_schema.sql`
4. Exécuter → les tables sont créées avec des données de test

## Déploiement Vercel

1. Pusher le code sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Ajouter les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → URL partageable en 2 minutes

## Formats triathlon

| Format | Distance |
|--------|----------|
| XS | 200m / 5km / 20km |
| S | 400m / 10km / 20km |
| M | 1,5km / 40km / 10km (olympique) |
| L | 2km / 80km / 20km |
| XL | 1,9km / 90km / 21km (half) |
| XXL | 3,8km / 180km / 42km (full Ironman) |
