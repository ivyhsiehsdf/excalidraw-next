# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbo mode
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run preview` - Build and start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run both linting and type checking
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Format code with Prettier

## Project Architecture

This is a Next.js 15 application built on the T3 Stack, specifically designed as an Excalidraw JSON viewer and validator.

### Key Technologies
- **Next.js 15** with React 19 and App Router
- **TypeScript** with strict configuration
- **@excalidraw/excalidraw** for diagram visualization
- **@t3-oss/env-nextjs** for environment variable validation
- **Zod** for runtime validation

### Application Structure

**Main Components:**
- `src/app/page.tsx` - Main application with JSON input form and Excalidraw viewer
- `src/app/api/excalidraw/route.ts` - API endpoint for JSON validation
- `src/app/layout.tsx` - Root layout with Geist font
- `src/env.js` - Environment variable schema and validation

**Core Functionality:**
- Accepts Excalidraw JSON input via textarea form
- Validates JSON structure (requires `elements` array)
- Renders diagrams using dynamically imported Excalidraw component
- Provides default example with sequence diagram (Client-Server interaction)
- Server-side validation through API route

### Important Implementation Details

**Dynamic Import Pattern:**
```typescript
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);
```
This prevents SSR issues with the Excalidraw component.

**Path Aliases:**
- `~/*` maps to `./src/*` (configured in tsconfig.json)

**Styling:**
- Uses CSS Modules (`src/app/index.module.css`)
- Imports Excalidraw CSS directly
- Global styles in `src/styles/globals.css`

### Environment Configuration

Uses T3's env validation system with Zod schemas for type-safe environment variables. Currently only validates `NODE_ENV` but structured for easy expansion.

### TypeScript Configuration

Strict TypeScript setup with:
- `noUncheckedIndexedAccess: true`
- `checkJs: true` 
- ESNext module system with bundler resolution
- Incremental compilation enabled

## Docker Deployment

The application is configured for Docker deployment with multi-stage builds:

### Docker Commands

**Build and run production container:**
```bash
docker build -t excalidraw-next .
docker run -p 3000:3000 excalidraw-next
```

**Using Docker Compose:**
```bash
# Production
docker-compose up --build

# Development (with hot reloading)
docker-compose --profile dev up --build app-dev
```

### Docker Configuration

- **Dockerfile** - Multi-stage production build using Node 20 Alpine and distroless runtime
- **Dockerfile.dev** - Development container with hot reloading
- **docker-compose.yml** - Production and development services
- **Next.js config** - Uses `output: "standalone"` for optimized Docker builds

**Key Docker features:**
- Environment validation skipped during build (`SKIP_ENV_VALIDATION=1`)
- Non-root user for security
- Health checks included
- Optimized layer caching
- Distroless runtime image for minimal attack surface