<!-- markdownlint-disable-file -->

# Task Research Notes: Documentation Structure Organization and Deduplication

## Research Executed

### File Analysis

- **.github/** directory structure
  - Contains mixed Copilot configurations, agents, instructions, and GitHub-specific files
  - Has duplication across multiple subdirectories (agents/, copilot/, copilot-instructions/, instructions/)
  - Includes 3 levels of CONTRIBUTING.md files with different content and purposes
  
- **docs/** directory structure
  - Well-organized according to DOCS_SPECIFICATION.md
  - Contains 13 main categories with clear separation of concerns
  - Includes meta/ directory with project management files that overlap with .github/
  
- **plan/** directory
  - Contains 6 feature implementation plans
  - Not integrated with docs/ or .github/ structure
  - Appears to be temporary/working directory for implementation tracking

### Code Search Results

- **CONTRIBUTING.md files found:**
  - `.github/CONTRIBUTING.md` (201 lines) - Original ng-alain template
  - `.github/copilot/instructions/CONTRIBUTING.md` (3 lines) - Placeholder redirect
  - `.github/instructions/CONTRIBUTING.md` (38 lines) - Brief guide
  - `docs/meta/CONTRIBUTING.md` (100 lines) - GigHub-specific complete guide
  
- **Agent files duplication:**
  - `.github/agents/` (6 files) - Core project-specific agents
  - `.github/copilot/agents/` (37 files) - Generic and specialized agents
  - Exact duplicates found: arch.agent.md, task-researcher.agent.md
  
- **Instruction files overlap:**
  - `.github/instructions/` (29 files) - Comprehensive Copilot instructions
  - `.github/copilot/instructions/` (6 files) - Minimal placeholders
  - `.github/copilot-instructions/` (2 files) - Accessibility-focused instructions

### External Research

No external research required - this is an internal project organization task.

### Project Conventions

- Standards referenced: DOCS_SPECIFICATION.md defines the canonical structure for docs/
- RESTRUCTURE_SUMMARY.md shows previous reorganization efforts for .github/
- Conventions followed: GitHub Copilot configuration standards, Angular project structure

## Key Discoveries

### Project Structure

Current state shows **THREE main documentation areas**:

1. **`.github/`** - GitHub and Copilot configuration
   - GitHub Actions workflows
   - Issue/PR templates
   - Copilot agents and instructions
   - **Problem**: Multiple nested subdirectories with overlapping purposes
   
2. **`docs/`** - Project documentation (canonical)
   - Well-structured according to DOCS_SPECIFICATION.md
   - 13 main categories: overview, setup, guides, reference, design, development, progress, operations, examples, meta, testing
   - **Problem**: Some overlap with .github/ meta content
   
3. **`plan/`** - Implementation plans
   - Feature-specific implementation plans
   - **Problem**: Not integrated with main documentation structure

### Implementation Patterns

**Duplication Categories Identified:**

1. **Configuration Files**
   - copilot-instructions.md appears in both .github/ and .github/copilot/
   - Multiple README.md files with different purposes
   
2. **Agent Definitions**
   - Core agents in .github/agents/
   - Generic agents in .github/copilot/agents/
   - Some exact duplicates (arch.agent.md, task-researcher.agent.md)
   
3. **Instruction Files**
   - .github/instructions/ - comprehensive Copilot behavior instructions
   - .github/copilot/instructions/ - minimal placeholders
   - .github/copilot-instructions/ - accessibility-specific
   
4. **Meta Documentation**
   - .github/ - CONTRIBUTING.md, SECURITY.md, README.md
   - docs/meta/ - CONTRIBUTING.md, code-review-guidelines.md, etc.
   - Different content but overlapping purposes

### Complete Examples

**Current Directory Structure (Problematic Areas):**

```
.github/
├── agents/                          # 6 core agents
│   ├── GigHub.agent.md
│   ├── arch.agent.md               # DUPLICATE
│   ├── context7++.agent.md
│   ├── context7+.agent.md
│   ├── hlbpa.agent.md
│   └── task-researcher.agent.md    # DUPLICATE
├── copilot/
│   ├── agents/                      # 37 agents (includes duplicates)
│   │   ├── 0-arch.agent.md
│   │   ├── arch.agent.md           # DUPLICATE
│   │   ├── task-researcher.agent.md # DUPLICATE
│   │   └── ... (34 more)
│   ├── instructions/                # 6 placeholder files
│   │   ├── ARCHITECTURE.md         # 2 lines
│   │   ├── CONTRIBUTING.md         # 3 lines
│   │   └── ...
│   ├── blueprints/                  # 5 files - OK
│   ├── collections/                 # 2 files - OK
│   ├── examples/                    # 1 file - OK
│   ├── prompts/                     # 31 files - OK
│   ├── tests/                       # 2 files - OK
│   └── workflows/                   # 3 files - OK
├── copilot-instructions/            # 2 accessibility files
│   ├── accessibility.instructions.md
│   └── code-review-standards.instructions.md
├── instructions/                    # 29 comprehensive instruction files
│   ├── angular.instructions.md
│   ├── typescript-5-es2022.instructions.md
│   └── ... (27 more)
├── workflows/                       # GitHub Actions
└── ISSUE_TEMPLATE/

docs/
├── design/
├── development/
├── examples/
├── guides/
├── meta/                            # Overlaps with .github/
│   ├── CONTRIBUTING.md              # Different from .github/CONTRIBUTING.md
│   ├── code-review-guidelines.md
│   ├── coding-standards.md
│   └── ...
├── operations/
├── overview/
├── progress/
├── reference/
├── setup/
└── testing/

plan/                                # Not integrated
├── feature-blueprint-module-1.md
├── feature-financial-module-extension-1.md
└── ... (4 more)
```

### API and Schema Documentation

Not applicable - this is a documentation organization task.

### Configuration Examples

**DOCS_SPECIFICATION.md Structure:**

```markdown
docs/
├── overview/        # Project vision, scenarios, glossary
├── setup/          # Prerequisites, installation, quick start
├── guides/         # Feature usage guides
├── reference/      # API, database, models
├── design/         # Architecture, ADR, diagrams, drafts
├── development/    # Roadmap, issues
├── progress/       # Done, todo, issues tracking
├── operations/     # Monitoring, logs, backup
├── examples/       # Code examples
├── meta/          # CONTRIBUTING, changelog, workflows
└── testing/        # Test guides
```

### Technical Requirements

1. **Preserve GitHub Copilot Functionality**
   - All Copilot-related files must remain in .github/copilot/
   - Instruction files must be properly structured for Copilot to detect
   
2. **Maintain GitHub Features**
   - Workflow files must stay in .github/workflows/
   - Issue templates must stay in .github/ISSUE_TEMPLATE/
   - Root-level .github/ files (CODEOWNERS, SECURITY.md, etc.) must remain
   
3. **Follow Project Conventions**
   - Respect DOCS_SPECIFICATION.md structure for docs/
   - Maintain separation between Copilot config (.github/) and project docs (docs/)

## Recommended Approach

### Classification Strategy

**Category 1: GitHub Infrastructure (Keep in .github/)**
- GitHub Actions workflows
- Issue/PR templates
- CODEOWNERS, SECURITY.md, dependabot.yml, etc.
- Root-level README.md and CONTRIBUTING.md (for GitHub display)

**Category 2: Copilot Configuration (Consolidate in .github/copilot/)**
- All agents (merge duplicates, remove .github/agents/)
- All instructions (consolidate from multiple locations)
- Prompts, blueprints, collections, examples, workflows (already correct)
- Main copilot-instructions.md (move from root .github/)

**Category 3: Project Documentation (Organize in docs/)**
- All project-specific documentation follows DOCS_SPECIFICATION.md
- Meta documentation (CONTRIBUTING, code review, etc.) in docs/meta/
- Implementation plans should move to docs/development/plans/

**Category 4: Remove/Consolidate**
- Placeholder instruction files in .github/copilot/instructions/
- Duplicate agents
- .github/copilot-instructions/ (merge into main instructions)
- Outdated summary files (RESTRUCTURE_SUMMARY.md, REORGANIZATION_SUMMARY.md)

### Detailed Organization Plan

#### Phase 1: Deduplication

1. **Agents Deduplication**
   - Remove exact duplicates from .github/agents/
   - Consolidate all agents into .github/copilot/agents/
   - Keep only unique, well-documented agents
   - Create an index/README in .github/copilot/agents/

2. **Instructions Consolidation**
   - Move all comprehensive .instructions.md files to .github/instructions/
   - Remove placeholder files from .github/copilot/instructions/
   - Merge .github/copilot-instructions/ files into .github/instructions/
   - Update file references in related configs

3. **CONTRIBUTING.md Resolution**
   - Keep .github/CONTRIBUTING.md for GitHub display (update to be GigHub-specific)
   - Keep docs/meta/CONTRIBUTING.md as canonical developer guide
   - Remove placeholder versions
   - Add cross-references between the two

#### Phase 2: Content Organization

1. **Root .github/ Files**
   ```
   .github/
   ├── CODEOWNERS
   ├── CONTRIBUTING.md           # GitHub display version (updated)
   ├── COPILOT_RESOURCES.md      # Index of Copilot features
   ├── FUNDING.yml
   ├── PULL_REQUEST_TEMPLATE.md
   ├── README.md                 # .github/ directory guide
   ├── SECURITY.md
   ├── alain-bot.yml
   ├── dependabot.yml
   ├── lock.yml
   ├── no-response.yml
   └── semantic.yml
   ```

2. **.github/copilot/ Structure**
   ```
   .github/copilot/
   ├── README.md                 # Copilot system overview
   ├── copilot-instructions.md   # Main Copilot config (moved from parent)
   ├── mcp-servers.yml
   ├── architecture-rules.md
   ├── constraints.md
   ├── domain-glossary.md
   ├── styleguide.md
   ├── security-rules.yml
   ├── memory.jsonl
   ├── store_memory.jsonl
   ├── agents/                   # All agents consolidated
   │   ├── README.md            # Agent index
   │   ├── 0-*.agent.md         # Priority/core agents
   │   └── *.agent.md           # Standard agents
   ├── blueprints/
   ├── collections/
   ├── examples/
   ├── prompts/
   ├── tests/
   └── workflows/
   ```

3. **.github/instructions/ (Copilot Behavior)**
   ```
   .github/instructions/
   ├── README.md                # Instructions index
   ├── angular.instructions.md
   ├── typescript-5-es2022.instructions.md
   ├── a11y.instructions.md     # Merged from copilot-instructions/
   ├── code-review-generic.instructions.md
   └── ... (all other .instructions.md files)
   ```

4. **.github/workflows/ (GitHub Actions)**
   ```
   .github/workflows/
   ├── ci.yml
   ├── codeql.yml
   ├── deploy-site.yml
   └── release.yml
   ```

5. **.github/ISSUE_TEMPLATE/**
   ```
   .github/ISSUE_TEMPLATE/
   ├── bug_report.yml
   ├── config.yml
   ├── feature_request.yml
   └── task.yml
   ```

6. **docs/ Structure (No changes needed)**
   - Already follows DOCS_SPECIFICATION.md
   - Only add docs/development/plans/ for implementation plans

7. **Implementation Plans**
   ```
   Move: plan/* → docs/development/plans/
   
   docs/development/
   ├── roadmap.md
   ├── issues/
   └── plans/                    # NEW
       ├── README.md
       ├── feature-blueprint-module-1.md
       ├── feature-financial-module-extension-1.md
       └── ...
   ```

#### Phase 3: Cleanup

1. **Remove Directories**
   - .github/agents/ (merged into copilot/agents/)
   - .github/copilot/instructions/ (placeholder files removed)
   - .github/copilot-instructions/ (merged into instructions/)
   - plan/ (moved to docs/development/plans/)

2. **Remove Redundant Files**
   - .github/RESTRUCTURE_SUMMARY.md (outdated)
   - docs/REORGANIZATION_SUMMARY.md (outdated)
   - docs/AZURE_DRAGON_INTEGRATION_SUMMARY.md (should be in design/drafts/ or ADR)
   - docs/BUGFIX_SUMMARY.md (should be in development/issues/ or progress/)
   - docs/VERIFICATION_REPORT.md (should be in testing/ or progress/)

3. **Update Cross-References**
   - Update all internal links to reflect new locations
   - Update .github/COPILOT_RESOURCES.md with new structure
   - Update docs/README.md if needed
   - Update any agent/prompt files that reference moved files

## Implementation Guidance

### Objectives

1. Eliminate duplication across .github/ subdirectories
2. Consolidate Copilot configuration in .github/copilot/
3. Separate Copilot config (.github/) from project docs (docs/)
4. Integrate implementation plans into docs/ structure
5. Remove outdated summary/report files
6. Maintain all GitHub and Copilot functionality

### Key Tasks

1. **Deduplication Phase**
   - Identify and remove duplicate agent files
   - Consolidate instruction files from multiple locations
   - Resolve CONTRIBUTING.md conflicts with clear purposes

2. **Reorganization Phase**
   - Move copilot-instructions.md to .github/copilot/
   - Consolidate all agents to .github/copilot/agents/
   - Merge accessibility instructions into main instructions/
   - Move implementation plans to docs/development/plans/

3. **Cleanup Phase**
   - Remove empty/placeholder directories
   - Remove outdated summary files
   - Update cross-references and links

4. **Documentation Phase**
   - Create index files (README.md) in reorganized directories
   - Update .github/COPILOT_RESOURCES.md
   - Update docs/README.md if needed

### Dependencies

- Git file operations (move, delete)
- Text file editing for link updates
- Directory creation and removal

### Success Criteria

- ✅ No duplicate files exist across .github/ subdirectories
- ✅ All Copilot configuration consolidated in .github/copilot/
- ✅ All project documentation follows DOCS_SPECIFICATION.md structure
- ✅ All cross-references updated and working
- ✅ Copilot functionality verified after reorganization
- ✅ GitHub Actions and templates still functional
- ✅ Clear separation between infrastructure (.github/) and documentation (docs/)
- ✅ Implementation plans integrated into docs/development/

