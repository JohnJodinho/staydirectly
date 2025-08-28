
# StayDirectly

StayDirectly is a full-stack property rental platform that enables direct booking and management of unique accommodations. It features deep integration with the Hospitable API for property sync, image optimization, and guest management. The project is built with a modern React SPA frontend and an Express/Node.js backend, sharing types and schema for robust type safety.

---

## Features

- **Direct booking** with no middlemen or extra fees
- **Hospitable API integration** for property sync, images, and guest data
- **Admin dashboard** for property owners
- **Google Maps** for property and city search
- **Modern UI** with Shadcn/ui, Radix, and Tailwind CSS
- **PostgreSQL** via Drizzle ORM, with shared schema and Zod validation

---

## Architecture Overview

- **Frontend**: React SPA (Wouter router, TanStack Query, Shadcn/ui)
- **Backend**: Express.js API server (TypeScript, Drizzle ORM, PostgreSQL)
- **Integration**: Hospitable API (property sync, images, onboarding)
- **Storage**: Swappable (Database or Memory) via factory pattern
- **Shared Types**: All schema and types in `shared/schema.ts` for end-to-end type safety

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Environment Variables
Create a `.env` file in the project root with:

```
DATABASE_URL=postgresql://user:pass@host:port/db
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_HOSPITABLE_CLIENT_TOKEN=your_hospitable_token
VITE_HOSPITABLE_API_URL=https://api.hospitable.com
```

### Install Dependencies
```bash
npm install
```

### Development
```bash
# Runs both backend and frontend (Vite + Express)

```

### Build & Production
```bash
npm run build
npm start
```

### Database Migrations
```bash
npm run db:push
```

---

## Project Structure

- `client/` - React SPA (pages, components, hooks, lib)
- `server/` - Express API, routes, integrations, storage
- `shared/` - Database schema, Zod validation, shared types
- `migrations/` - Drizzle migration files
- `vite.config.ts` - Vite + backend config

---

## Key Patterns & Conventions

- **Shared Schema**: All DB tables/types in `shared/schema.ts`, imported on both client and server
- **Storage Factory**: Use `storage-factory.ts` to switch between DB and in-memory storage
- **API Logging**: All API and outgoing requests are logged with timing and response snippets
- **Platform IDs**: Properties use `platformId` (format: `customerId/listingId` or `customerId:listingId`)
- **API Requests**: Use `apiRequest()` from `client/src/lib/api.ts` for all client-server calls
- **Rate Limiting**: All external API calls are rate-limited in `server/utils/rateLimiter.ts`

---

## Example: Adding a New Property Table

1. Define table in `shared/schema.ts` using Drizzle ORM
2. Generate Zod schema with `createInsertSchema()`
3. Run `npm run db:push` to migrate
4. Add API endpoints in `server/routes.ts`
5. Use TanStack Query for frontend data fetching

---

## Example: Integrating with Hospitable

- Use `extractPropertyIds(platformId)` from `client/src/lib/hospitable/property-utils.ts`
- Image URLs: `/api/hospitable/property-images/{customerId}/{listingId}/primary`
- Onboarding flow: see `client/src/hooks/use-onboarding-flow.ts`

---

## Scripts

- `npm run dev` - Start development server (Vite + Express)
- `npm run build` - Build frontend and backend
- `npm start` - Start production server
- `npm run db:push` - Run Drizzle migrations

---


MIT
