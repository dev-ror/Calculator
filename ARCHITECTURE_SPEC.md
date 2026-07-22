# Shopify Shipping Calculator - Production Monorepo Development Roadmap

## Objective

Transform the existing Shopify Shipping Calculator application into a production-grade monorepo architecture while preserving the current working Shopify application.

Current application status:

- Shopify app frontend/UI is already created
- Application runs successfully on localhost
- Shopify embedded app structure exists
- Backend is not created yet
- Database is not created yet
- Shipping calculation engine is not created yet

The goal is:

1. Keep the existing UI working
2. Improve architecture step-by-step
3. Prepare the application for future backend
4. Prepare the application for database integration
5. Prepare the application for Shopify shipping rate override functionality


==================================================

# IMPORTANT RULES

DO NOT:

- Rewrite existing working frontend
- Change UI design
- Change Polaris components unnecessarily
- Break Shopify embedded app
- Change Shopify authentication flow
- Change App Bridge behavior
- Change React Router structure unnecessarily
- Add unnecessary dependencies
- Change existing functionality


Prefer:

- Moving files safely
- Creating proper architecture
- Adding new layers gradually
- Preserving existing code
- Minimal changes


==================================================

# CURRENT TECHNOLOGY STACK

Current application uses:

- Shopify CLI
- React Router v7
- Vite
- React
- Polaris
- Shopify App Bridge
- Embedded Shopify App architecture


Future planned stack:

- Prisma
- Database layer
- Backend services
- Shipping calculation engine
- Shopify Functions
- Shipping rate override logic


==================================================

# CURRENT DEVELOPMENT STATUS

Current:

Frontend Layer:

DONE

Contains:

- Pages
- Components
- Polaris UI
- Routes
- Forms
- Layout


Not created yet:

Backend

Database

Shipping Engine

Courier Integrations

Business Rules


==================================================

# FINAL ARCHITECTURE GOAL


calculator/


apps/

└── shopify-app/

Contains the actual Shopify application.


Responsible for:

- Shopify authentication
- OAuth
- App Bridge
- Embedded app
- React Router
- UI routes
- Loaders
- Actions


--------------------------------------------------


packages/


## backend

Future business logic layer.


Contains:

- Shipping calculator
- Rate calculation
- Shipping rules
- Courier integrations
- Validation
- Services


Example:


import { calculateShipping }
from "@calculator/backend"



--------------------------------------------------


## database


Database layer.


Contains:

- Prisma schema
- Prisma migrations
- Prisma client
- Database repositories


Example:


import prisma from "@calculator/database"



--------------------------------------------------


## shared


Common code.


Contains:

- Types
- Interfaces
- Constants
- Enums
- DTOs
- Validators
- Utilities


Rules:

shared cannot depend on other packages.


--------------------------------------------------


## ui


Reusable UI library.


Contains:

- Buttons
- Cards
- Tables
- Modals
- Loaders
- Polaris wrappers


Do not move route-specific components here.



==================================================

# SHOPIFY APPLICATION RULES


The Shopify app must remain ONE application.


Do NOT create:


apps/frontend

apps/backend


Shopify lifecycle must remain inside:


apps/shopify-app


Keep:

- shopify.server.js
- OAuth
- Sessions
- App Bridge
- Webhooks
- React Router loaders
- React Router actions


Never move Shopify authentication into backend.



==================================================

# DEVELOPMENT PHASES


==================================================

# PHASE 1

## Convert existing Shopify app into monorepo


Goal:

Only architecture setup.


Do NOT move business logic.


Tasks:

- Create npm workspace
- Create root package.json
- Create apps/shopify-app
- Move current Shopify app safely
- Configure workspace


Verify:


npm install

npm run dev

npm run build



Expected result:

Existing UI works exactly as before.



==================================================

# PHASE 2

## Create Database Foundation


Currently database does not exist.


Create:


packages/database


Add:

- Prisma setup
- Schema structure
- Database client


Do not connect business logic yet.



Verify:


Prisma generate works

Application starts



==================================================

# PHASE 3

## Create Backend Foundation


Create:


packages/backend


Move future business logic here.


Contains:


shipping/

calculator/

rules/

providers/

rates/


Create services:


- ShippingService
- RateService
- RuleEngine



Backend must not contain:


- React
- Polaris
- App Bridge



==================================================

# PHASE 4

## Add Shipping Calculation Engine


Implement:


- Shipping price calculation
- Custom rules
- Rate generation
- Shipping overrides


Example:


calculateShipping(order)



The calculation engine must be independent from Shopify UI.



==================================================

# PHASE 5

## Shopify Shipping Override Integration


Connect backend shipping engine with Shopify.


Handle:

- Shopify shipping requests
- Shipping functions
- Custom rates
- Override logic


Keep Shopify authentication and embedded app unchanged.



==================================================

# PHASE 6

## Extract Shared Code


Move:


- Types
- Interfaces
- Constants
- Validation schemas


Into:


packages/shared



==================================================

# DEPENDENCY RULES


Allowed:


shared

↓

database

↓

backend

↓

shopify-app



ui

↓

shopify-app



Forbidden:


shared → backend

shared → database

database → backend

backend → ui



No circular dependencies.



==================================================

# REQUIRED ROOT COMMANDS


Must work:


npm install

npm run dev

npm run build

npm run lint

npm run typecheck



==================================================

# GIT SAFETY


Before every phase:


- Create git checkpoint
- Commit changes
- Use git mv where possible


If something breaks:

Rollback.



==================================================

# FINAL VALIDATION


Complete only when:


✓ Shopify app starts

✓ Embedded app works

✓ App Bridge works

✓ Existing UI works

✓ Backend works

✓ Database works

✓ Prisma works

✓ Shipping calculation works

✓ Shipping override works

✓ No broken imports

✓ No circular dependencies

✓ Production deployment works



==================================================

# CODING PRINCIPLES


Always:

- Preserve existing code
- Make small changes
- Build step-by-step
- Keep Shopify lifecycle intact


Never:

- Rewrite working features
- Change UI unnecessarily
- Mix frontend and backend
- Put Shopify logic inside backend


==================================================

END OF SPECIFICATION