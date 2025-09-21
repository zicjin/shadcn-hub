
# Implementation Plan: ShadCN Component Aggregator

**Branch**: `001-create-a-website` | **Date**: 2025-09-21 | **Spec**: `/specs/001-create-a-website/spec.md`
**Input**: Feature specification from `/specs/001-create-a-website/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
A website that aggregates and displays UI component examples from 7 shadcn-based component libraries. Users can browse components via dual-axis navigation (by source website or by component type), view real interactive component renderings, and access source code. Built with TypeScript, TanStack, Tailwind CSS, with Crawlee for web scraping and PostgreSQL/Drizzle for data storage.

## Technical Context
**Language/Version**: TypeScript 5.x (latest stable)
**Primary Dependencies**: TanStack (Query, Router, Table), Tailwind CSS, shadcn/ui, Zustand, Zod, Fuse.js, Crawlee, Drizzle ORM
**Storage**: PostgreSQL (native, username: postgres, no password)
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge)
**Project Type**: web (frontend+backend architecture)
**Performance Goals**: <3s initial load, <500ms search response, support 1000 concurrent users
**Constraints**: <200ms component render time, responsive design for mobile/tablet/desktop
**Scale/Scope**: 7 source websites, ~500 components total, 10k daily active users

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality Standards**: ✅ TypeScript enforces type safety. ESLint + Prettier for linting/formatting. Modular architecture with clear separation of concerns.

**Testing Requirements**: ✅ Unit tests with Vitest (80% coverage target), E2E tests with Playwright, TDD approach for critical paths.

**User Experience Consistency**: ✅ shadcn/ui design system, Tailwind for consistent styling, WCAG 2.1 AA compliance, responsive design included.

**Performance Requirements**: ✅ <3s load time target, PostgreSQL indexing planned, code splitting with Vite, performance monitoring included.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Frontend React app with backend API service

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API endpoint (11 endpoints) → contract test task [P]
- Each entity (8 entities) → Drizzle model creation task [P]
- Each user story (5 scenarios) → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Database → Models → Services → API → Frontend
- Mark [P] for parallel execution (independent files)

**Task Categories**:
1. **Setup Tasks** (3-4 tasks)
   - Initialize monorepo structure
   - Setup PostgreSQL and Drizzle
   - Configure TypeScript, ESLint, Prettier

2. **Database Tasks** (8-10 tasks)
   - Create Drizzle schemas for each entity
   - Setup migrations
   - Create indexes and constraints

3. **API Contract Tests** (11 tasks, all [P])
   - One test file per endpoint
   - Test request/response schemas

4. **Backend Implementation** (15-20 tasks)
   - Express server setup
   - API route implementations
   - Service layer for business logic
   - Crawler implementation with Crawlee

5. **Frontend Tasks** (10-15 tasks)
   - React app setup with Vite
   - Component hierarchy
   - TanStack Router pages
   - Zustand stores
   - UI components with shadcn

6. **Integration Tests** (5 tasks)
   - E2E tests for each user scenario
   - Performance validation tests

**Estimated Output**: 50-60 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
