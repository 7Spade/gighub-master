<!-- markdownlint-disable-file -->

# Documentation Reorganization - Detailed Action Plan

## 🎯 Executive Summary

This document provides step-by-step commands and procedures to reorganize the GigHub project documentation structure, eliminating duplication and improving clarity.

## ⚠️ Pre-Execution Checklist

- [ ] Commit all current work
- [ ] Create a backup branch: `git checkout -b backup/pre-reorganization`
- [ ] Create working branch: `git checkout -b docs/reorganize-structure`
- [ ] Ensure no uncommitted changes: `git status`

## 📦 Phase 1: Deduplication (Agents)

### 1.1 Analyze Current Agents

```bash
# Check for duplicate agents
cd .github
diff agents/arch.agent.md copilot/agents/arch.agent.md
diff agents/task-researcher.agent.md copilot/agents/task-researcher.agent.md

# List all agent files
echo "=== Agents in .github/agents/ ==="
ls -1 agents/
echo "=== Agents in .github/copilot/agents/ ==="
ls -1 copilot/agents/
```

### 1.2 Move Unique Agents

```bash
# Move unique agents from .github/agents/ to .github/copilot/agents/
# with 0- prefix to indicate core/priority status

cd .github

# Move GigHub core agent
mv agents/GigHub.agent.md copilot/agents/0-GigHub.agent.md

# Move context7 variants (already have 0- prefix equivalents in copilot/agents/)
# Check if they're duplicates first
diff agents/context7++.agent.md copilot/agents/context7.agent.md || true

# Move hlbpa agent
mv agents/hlbpa.agent.md copilot/agents/hlbpa.agent.md

# Note: arch.agent.md and task-researcher.agent.md already exist in copilot/agents/
# We'll verify they're identical and remove from agents/
```

### 1.3 Verify and Remove Duplicates

```bash
cd .github

# Verify duplicates are identical
echo "Checking arch.agent.md..."
diff agents/arch.agent.md copilot/agents/arch.agent.md && echo "✓ Identical" || echo "⚠ Different"

echo "Checking task-researcher.agent.md..."
diff agents/task-researcher.agent.md copilot/agents/task-researcher.agent.md && echo "✓ Identical" || echo "⚠ Different"

# If identical, remove from agents/
# If different, need to merge manually
```

### 1.4 Create Agent Index

```bash
cd .github/copilot/agents

cat > README.md << 'AGENTINDEX'
# GitHub Copilot Agents

This directory contains all GitHub Copilot agent definitions for the GigHub project.

## 🌟 Core Project Agents (Priority)

These agents are prefixed with `0-` to indicate they are core to the GigHub project and should be loaded with priority.

- **0-GigHub.agent.md** - Main GigHub project agent, understands project structure and conventions
- **0-context7++.agent.md** - Advanced Context7 Angular expert with comprehensive framework knowledge
- **0-context7+.agent.md** - Basic Context7 Angular expert for common tasks
- **0-arch.agent.md** - Core architecture agent for system design
- **0-ng-ArchAI-v1.agent.md** - Angular architecture AI specialist
- **0-ng-governance-v1.md** - Angular governance and best practices
- **0-implementation-plan.agent.md** - Implementation planning specialist
- **0-playwright-tester.agent.md** - E2E testing with Playwright
- **0-postgresql-dba.agent.md** - PostgreSQL database administration
- **0-principal-software-engineer.agent.md** - Senior engineering guidance
- **0-supabase.angular.md** - Supabase + Angular integration

## 📦 Specialized Agents

### Architecture & Design
- **arch.agent.md** - Generic architecture guidance
- **architecture.agent.md** - System architecture design
- **adr-generator.agent.md** - Architecture Decision Records generator
- **api-architect.agent.md** - API design specialist

### Planning & Analysis
- **plan.agent.md** - General planning agent
- **planner.agent.md** - Task planning
- **task-planner.agent.md** - Detailed task breakdown
- **task-researcher.agent.md** - Research specialist
- **implementation-plan.agent.md** - Implementation plan generator
- **prd-analysis.agent.md** - PRD analysis and breakdown
- **specification.agent.md** - Technical specification writer

### Development & Engineering
- **software-engineer-agent-v1.agent.md** - General software engineering
- **principal-software-engineer.agent.md** - Senior engineering patterns
- **code-review.agent.md** - Code review specialist
- **debug.agent.md** - Debugging assistant
- **janitor.agent.md** - Code cleanup and refactoring
- **mentor.agent.md** - Teaching and explanation

### Database & Backend
- **postgresql-dba.agent.md** - PostgreSQL specialist
- **rls-policy.agent.md** - Row Level Security policies

### Testing
- **playwright-tester.agent.md** - E2E testing

### Business & Product
- **business-model.agent.md** - Business model analysis
- **critical-thinking.agent.md** - Critical analysis

### Tools & Utilities
- **code-tour.agent.md** - Code exploration guide
- **context7.agent.md** - Context7 documentation access

### Configuration
- **auto-triggers.yml** - Automatic agent triggers
- **config.yml** - Agent configuration

## 📖 Usage

Agents can be invoked in GitHub Copilot Chat using the @ mention syntax:

```
@workspace /agent <agent-name>
```

For more information about using agents, see the [Copilot documentation](../README.md).
AGENTINDEX
```

### 1.5 Remove Old Agents Directory

```bash
cd .github

# Verify all unique agents have been moved
ls -la agents/

# If empty or only contains duplicates, remove
rm -rf agents/
```

## 📦 Phase 2: Deduplication (Instructions)

### 2.1 Consolidate Instruction Files

```bash
cd .github

# Move accessibility instructions from copilot-instructions/ to instructions/
# Check if already exists
if [ ! -f instructions/a11y.instructions.md ]; then
  mv copilot-instructions/accessibility.instructions.md instructions/a11y.instructions.md
fi

# Merge code-review-standards if needed
if [ -f copilot-instructions/code-review-standards.instructions.md ]; then
  # Check if different from code-review-generic.instructions.md
  if [ -f instructions/code-review-generic.instructions.md ]; then
    echo "⚠ Need to merge code-review files manually"
  else
    mv copilot-instructions/code-review-standards.instructions.md instructions/
  fi
fi
```

### 2.2 Remove Placeholder Instruction Files

```bash
cd .github/copilot/instructions

# These are placeholder files - verify they're just redirects
for file in *.md; do
  lines=$(wc -l < "$file")
  echo "$file: $lines lines"
done

# If all are < 10 lines, they're placeholders - remove directory
cd ..
rm -rf instructions/
```

### 2.3 Remove copilot-instructions Directory

```bash
cd .github

# After moving all unique files
rm -rf copilot-instructions/
```

### 2.4 Create Instructions Index

```bash
cd .github/instructions

cat > README.md << 'INSTRUCTINDEX'
# GitHub Copilot Instructions

This directory contains behavior instructions that guide GitHub Copilot's code generation and assistance for the GigHub project.

## 📋 Instruction Files

### Language & Framework Specific

- **angular.instructions.md** - Angular 20 development patterns and best practices
- **typescript-5-es2022.instructions.md** - TypeScript 5.x coding standards
- **sql-sp-generation.instructions.md** - SQL stored procedure patterns
- **shell.instructions.md** - Shell scripting guidelines

### Code Quality & Standards

- **code-review-generic.instructions.md** - Code review standards
- **self-explanatory-code-commenting.instructions.md** - Comment guidelines
- **taming-copilot.instructions.md** - Copilot behavior controls
- **ANTI_PATTERNS.md** - Anti-patterns to avoid
- **a11y.instructions.md** - Accessibility (WCAG) compliance

### Architecture & Design

- **ARCHITECTURE.md** - System architecture overview
- **containerization-docker-best-practices.instructions.md** - Docker best practices

### DevOps & CI/CD

- **devops-core-principles.instructions.md** - DevOps fundamentals
- **github-actions-ci-cd-best-practices.instructions.md** - GitHub Actions patterns

### Security

- **security-and-owasp.instructions.md** - OWASP security guidelines

### Performance

- **performance-optimization.instructions.md** - Performance best practices

### Documentation

- **markdown.instructions.md** - Markdown formatting standards
- **instructions.instructions.md** - Meta: How to write instructions
- **prompt.instructions.md** - How to write prompt files
- **localization.instructions.md** - Localization guidelines

### Development Workflow

- **spec-driven-workflow-v1.instructions.md** - Specification-driven development
- **task-implementation.instructions.md** - Task implementation workflow
- **memory-bank.instructions.md** - Memory bank system
- **copilot-thought-logging.instructions.md** - Thought process logging

### Project Management

- **CONTRIBUTING.md** - Contribution guidelines (brief)
- **CODE_OF_CONDUCT.md** - Code of conduct
- **DEVELOPMENT.md** - Development setup
- **DEPLOYMENT.md** - Deployment procedures

## 🎯 How Instructions Work

Instructions files are automatically loaded by GitHub Copilot based on the `applyTo` frontmatter:

```yaml
---
description: 'Brief description'
applyTo: '**/*.ts'  # Glob pattern for file matching
---
```

## 📖 Creating New Instructions

See [instructions.instructions.md](./instructions.instructions.md) for guidelines on creating new instruction files.

## 🔗 Related

- [Copilot Agents](../copilot/agents/) - Agent definitions
- [Copilot Prompts](../copilot/prompts/) - Reusable prompts
INSTRUCTINDEX
```

## 📦 Phase 3: Content Organization

### 3.1 Move Copilot Main Config

```bash
cd .github

# Move copilot-instructions.md to copilot/
mv copilot-instructions.md copilot/

# Update any references (search for copilot-instructions.md)
grep -r "copilot-instructions.md" . --include="*.md" --include="*.yml"
```

### 3.2 Create Implementation Plans Directory

```bash
cd docs/development

# Create plans directory
mkdir -p plans

# Move all plan files
cd ../../plan
for file in *.md; do
  mv "$file" ../docs/development/plans/
done

# Create README
cd ../docs/development/plans

cat > README.md << 'PLANINDEX'
# Implementation Plans

This directory contains detailed implementation plans for GigHub features.

## 📋 Active Plans

- **feature-blueprint-module-1.md** - Blueprint (workspace) module implementation
- **feature-financial-module-extension-1.md** - Financial module extension
- **feature-organization-switcher-1.md** - Organization switcher UI
- **feature-shared-modules-analysis-1.md** - Shared modules analysis
- **feature-supabase-infrastructure-1.md** - Supabase infrastructure setup
- **refactor-route-migration-workspace-context-1.md** - Route migration to workspace context

## 📖 Plan Template

Each implementation plan follows this structure:

```markdown
---
goal: <Feature goal>
version: <Version number>
date_created: <YYYY-MM-DD>
last_updated: <YYYY-MM-DD>
owner: <Owner>
status: <Status>
tags: [<tags>]
---

# Introduction
# Requirements & Constraints
# Implementation Steps
# Testing Strategy
# Deployment Plan
# Success Criteria
```

## 🔗 Related

- [Development Roadmap](../roadmap.md)
- [Issues](../issues/)
- [Progress Tracking](../../progress/)
PLANINDEX
```

### 3.3 Remove Old Plan Directory

```bash
cd /home/runner/work/gighub-master/gighub-master

# Verify it's empty
ls -la plan/

# Remove
rmdir plan/
```

### 3.4 Reorganize Summary Files

```bash
cd docs

# Move AZURE_DRAGON_INTEGRATION_SUMMARY.md to design/drafts/
mv AZURE_DRAGON_INTEGRATION_SUMMARY.md design/drafts/

# Move BUGFIX_SUMMARY.md to development/issues/
mv BUGFIX_SUMMARY.md development/issues/2025-12-08-bugfix-summary.md

# Move VERIFICATION_REPORT.md to testing/
mv VERIFICATION_REPORT.md testing/2025-12-08-verification-report.md

# Archive or remove old reorganization summaries
mv REORGANIZATION_SUMMARY.md development/issues/archive-reorganization-summary.md
```

## 📦 Phase 4: Update Documentation

### 4.1 Update COPILOT_RESOURCES.md

```bash
cd .github

# Update COPILOT_RESOURCES.md to reflect new structure
# This needs to be done manually or with sed/awk
```

### 4.2 Update CONTRIBUTING.md Files

```bash
# Update .github/CONTRIBUTING.md to be GigHub-specific
# and reference docs/meta/CONTRIBUTING.md for detailed guide

# Add cross-reference at the top:
# > For detailed contributing guidelines, see [docs/meta/CONTRIBUTING.md](../docs/meta/CONTRIBUTING.md)
```

### 4.3 Update Links in Documentation

```bash
# Find all markdown files with potential broken links
cd /home/runner/work/gighub-master/gighub-master

# Search for references to moved files
grep -r "\.github/agents/" --include="*.md" .
grep -r "\.github/copilot-instructions/" --include="*.md" .
grep -r "plan/" --include="*.md" .

# Update each reference found
```

## 📦 Phase 5: Verification

### 5.1 Verify Directory Structure

```bash
cd /home/runner/work/gighub-master/gighub-master

# Verify new structure
echo "=== .github structure ==="
tree -L 2 .github/

echo "=== docs/development structure ==="
tree -L 2 docs/development/

echo "=== Verify old directories removed ==="
[ ! -d .github/agents ] && echo "✓ .github/agents removed" || echo "✗ .github/agents still exists"
[ ! -d .github/copilot-instructions ] && echo "✓ .github/copilot-instructions removed" || echo "✗ still exists"
[ ! -d .github/copilot/instructions ] && echo "✓ .github/copilot/instructions removed" || echo "✗ still exists"
[ ! -d plan ] && echo "✓ plan directory removed" || echo "✗ plan still exists"
```

### 5.2 Check for Duplicates

```bash
# Find duplicate file names (should be none)
find . -name "*.agent.md" -type f | rev | cut -d/ -f1 | rev | sort | uniq -d
find . -name "*.instructions.md" -type f | rev | cut -d/ -f1 | rev | sort | uniq -d
```

### 5.3 Verify Markdown Links

```bash
# Use markdown-link-check or similar tool
npm install -g markdown-link-check

# Check key files
markdown-link-check .github/README.md
markdown-link-check .github/copilot/README.md
markdown-link-check docs/README.md
```

## 📊 Final Checklist

- [ ] All agents consolidated in .github/copilot/agents/
- [ ] All instructions in .github/instructions/
- [ ] Agent index created (.github/copilot/agents/README.md)
- [ ] Instructions index created (.github/instructions/README.md)
- [ ] Plans index created (docs/development/plans/README.md)
- [ ] copilot-instructions.md moved to .github/copilot/
- [ ] Implementation plans moved to docs/development/plans/
- [ ] Old directories removed (agents/, copilot-instructions/, copilot/instructions/, plan/)
- [ ] Summary files reorganized
- [ ] Cross-references updated
- [ ] Links verified
- [ ] No duplicate files
- [ ] Git status clean (all changes committed)

## 🎉 Completion

Once all steps are complete:

```bash
# Review all changes
git status
git diff --stat

# Commit the reorganization
git add .
git commit -m "docs: reorganize documentation structure

- Consolidate all agents in .github/copilot/agents/
- Consolidate all instructions in .github/instructions/
- Move implementation plans to docs/development/plans/
- Remove duplicate files and directories
- Create index files for better navigation
- Update cross-references and links

Closes #<issue-number>"

# Push to remote
git push origin docs/reorganize-structure

# Create PR
gh pr create --title "Documentation Structure Reorganization" \
  --body "See .copilot-tracking/research/20251208-reorganization-visual-guide.md for details"
```

