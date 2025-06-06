# Prompt-or-Die Project Rules & Standards

**Comprehensive guidelines for maintaining code quality, architecture, and development practices in the Prompt-or-Die monorepo.**

---

## 🏗️ Architecture & Structure Rules

### Monorepo Organization
- **Root Level**: Main React application with Vite + TypeScript
- **Packages**: Separate workspace packages (`packages/core`, `packages/cli`)
- **Core Package**: CommonJS library with dual ESM/CJS exports
- **CLI Package**: ESM-only interactive CLI tool
- **Turbo**: Use for build orchestration and caching

### Directory Structure Standards
```
src/
├── components/          # React components
│   └── ui/             # Shadcn/ui base components
├── hooks/              # Custom React hooks
├── lib/               # Utilities and integrations
├── pages/             # Route components
├── types/             # TypeScript definitions
└── integrations/      # Third-party service integrations
```

## 🎨 Design System Rules

### Brand Identity ("Anti Cult Society")
- **Colors**: Death Black (#000000), Bone White (#FFFFFF), Inferno Red (#FF2E2E), Glitch Blue (#00F0FF)
- **Typography**: UnifrakturCook/Cinzel for headings, IBM Plex Mono/JetBrains Mono for code
- **Voice**: Subtle, poetic, futurist, anti-authoritarian
- **Theme**: Always dark mode by default, cult-adjacent aesthetic

### UI Component Standards
- **Base**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Variants**: Use `class-variance-authority` for component variants
- **Composition**: Prefer `asChild` pattern for flexible composition

## 💻 Code Quality Rules

### TypeScript Configuration
- **Strict Mode**: All strict type checking enabled
- **Path Mapping**: Use `@/*` aliases for clean imports
- **Target**: ES2022 with modern browser support
- **Module**: ESNext with bundler resolution

### Code Style Standards
- **Prettier**: 2 spaces, single quotes, trailing commas, 100 char width
- **ESLint**: React hooks rules, no unused vars, relaxed explicit any
- **Imports**: Absolute imports with path aliases
- **File Naming**: kebab-case for files, PascalCase for components

### Testing Requirements
- **Coverage**: Minimum 80% for branches, functions, lines, statements
- **Framework**: Jest with ts-jest for TypeScript
- **Location**: Co-locate tests in `__tests__` directories
- **Naming**: `.test.ts` or `.spec.ts` extensions

## 🔧 Development Workflow Rules

### Git Hooks & Automation
- **Pre-commit**: Lint-staged with ESLint fix + Prettier format
- **Commit Messages**: Conventional commits with commitlint
- **Husky**: Git hooks for quality gates

### Build & Deployment
- **Main App**: Vite build with SWC for fast compilation
- **Core Package**: Rollup with TypeScript, dual module exports
- **CLI Package**: TypeScript compilation to dist
- **Turbo**: Parallel builds with dependency awareness

### Environment Management
- **Vite Env**: `VITE_` prefix for client-side variables
- **Supabase**: URL and anon key configuration
- **Development**: Local server on port 8080 with IPv6 support

## 🗄️ Data & Backend Rules

### Supabase Integration
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth with email/password + OAuth
- **Types**: Generate TypeScript types from database schema
- **Migrations**: Version-controlled SQL migrations

### State Management
- **Global State**: React Context for auth, theme, terminal
- **Server State**: TanStack Query for data fetching
- **Local State**: React hooks (useState, useReducer)
- **Forms**: React Hook Form with Zod validation

## 📦 Package Management Rules

### Dependencies
- **UI**: Radix UI primitives + custom components
- **Styling**: Tailwind CSS + tailwindcss-animate
- **Validation**: Zod for runtime type checking
- **Build**: Vite + SWC for fast development
- **Monorepo**: npm workspaces + Turbo

### Version Management
- **Core Package**: Semantic versioning (currently 1.0.4)
- **CLI Package**: Independent versioning (1.0.0)
- **Main App**: Development version (0.1.0)

## 🚀 Performance Rules

### Bundle Optimization
- **Code Splitting**: Route-based with React.lazy
- **Tree Shaking**: ESM modules for optimal bundling
- **Assets**: SVG icons, optimized images
- **Caching**: Turbo build cache, browser caching strategies

### Runtime Performance
- **React**: Functional components with hooks
- **Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for routes
- **Query Optimization**: TanStack Query for efficient data fetching

## 🔒 Security Rules

### Authentication & Authorization
- **RLS Policies**: Database-level security with Supabase
- **Protected Routes**: Client-side route protection
- **API Keys**: Environment variables, never hardcoded
- **CORS**: Proper configuration for API access

### Data Validation
- **Input Validation**: Zod schemas for all user inputs
- **Type Safety**: Strict TypeScript throughout
- **SQL Injection**: Parameterized queries via Supabase client
- **XSS Protection**: React's built-in escaping + CSP headers

## 📚 Documentation Rules

### Code Documentation
- **JSDoc**: Comprehensive function and class documentation
- **README**: Clear setup and development instructions
- **Type Definitions**: Self-documenting TypeScript interfaces
- **Comments**: Explain complex business logic, not obvious code

### API Documentation
- **Core SDK**: Export comprehensive type definitions
- **CLI**: Help commands and usage examples
- **Database**: Schema documentation in migrations

---

## 🔥 Enhanced TypeScript Validation Rules

### 1. Always Use TypeScript by Default

**Default Language**: Unless explicitly instructed otherwise, every project or code generation must use TypeScript.

**Reasons**: Type safety, better LLM validation loops, and up-to-date ecosystem support.

### 2. Validate Against the Latest Versions & Methods

#### Web-Check Before You Write
- Query the npm registry (or equivalent) for latest package versions
- Scrape or fetch official changelogs for key frameworks/features (e.g., TypeScript, React, Next.js, Jest)
- This ensures you're not relying on stale, outdated knowledge

#### Snapshot "Old" vs. "New"
- **old-state.md**: Captures what the LLM "thinks" it knows (versions + methods)
- **new-state.md**: Captures the actual, validated latest versions + bullet points of changed/added methods (all with links)
- **Purpose**: Compare assumptions vs. reality so the LLM cannot hallucinate outdated APIs

#### Block Any Outdated Usage
- If the LLM's code uses a deprecated method or version not matching new-state.md, veto it
- Feed compiler/linter errors that explicitly reference lines in new-state.md until it aligns with the latest

### 3. When Starting a New Project

#### Generate Fresh package.json
- Use versions from new-state.md for dependencies

#### Bootstrap tsconfig.json with Strict Flags
- Must include `strict`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noUnusedLocals`, `noUnusedParameters`, `useDefineForClassFields`

#### Create old-state.md & new-state.md
- Even for fresh projects, snapshot what you thought (empty or minimal) vs. actual latest

### 4. File Summary

- **validation-rules.md**: Consolidated rules + guidelines
- **old-state.md**: LLM's assumed versions & methods
- **new-state.md**: Validated latest versions & bullet points (with links)
- **tsconfig.json**: Pre-configured with strict options from new-state.md
- **package.json**: Populated with the latest dependencies

### 5. Workflow Steps

#### Pre-Flight Script
Run a Node/TS script to:
1. Read package.json or default assumptions
2. Fetch latest versions from npm (or registry)
3. Scrape changelogs for key frameworks/tools
4. Emit old-state.md & new-state.md in markdown format (with citations)

#### System Prompt for LLM
Prepend entire validation-rules.md, old-state.md, and new-state.md.

**Instructions**:
- Always use TypeScript unless explicitly told otherwise
- Use only versions & APIs listed in new-state.md
- Discard any outdated patterns from old-state.md
- Cite any external references when introducing new code or methods

#### Compile & Lint Check
- After LLM code output, run `tsc --noEmit` & `eslint`
- If errors reference old/deprecated code, block and feed back errors with direct citations from new-state.md

#### Iteration & Logging
- Log every mismatch between LLM output and new-state.md
- Use logs to refine system prompts or consider fine-tuning if repeated mistakes occur

---

**Follow these rules exactly in a single workflow to keep your LLM-generated code current and bulletproof.**
