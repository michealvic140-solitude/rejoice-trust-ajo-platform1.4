# Rejoice Ajo - Trust Platform

## Overview
A rotating savings (Ajo/ROSCA) platform for Nigerians. Users can join trusted savings circles and make structured rotating contributions.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 8
- **Routing**: React Router DOM v6
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **State/Data**: TanStack React Query
- **Forms**: React Hook Form + Zod

## Project Structure
- `src/App.tsx` - Root component with routing setup
- `src/pages/` - Page components (Landing, Login, Register, Dashboard, Groups, GroupDetail, Profile, Admin)
- `src/components/` - Shared components (Navbar, GroupCard, NavLink, ParticleBackground, UI components)
- `src/context/AppContext.tsx` - Global app state
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

## Running the App
The app runs via the "Start application" workflow using `npm run dev` on port 5000.

## Notes
- Migrated from Lovable to Replit: removed `lovable-tagger` dependency (incompatible with Vite 8)
- Vite configured to use port 5000 with `host: "0.0.0.0"` for Replit compatibility
