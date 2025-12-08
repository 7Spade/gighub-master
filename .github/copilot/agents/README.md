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
- **0-meta-agentic-project-scaffold.agent.md** - Project scaffolding

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
- **hlbpa.agent.md** - High-level backend planning agent

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

## 🔗 Related

- [Copilot Instructions](../../instructions/) - Behavior instructions for Copilot
- [Copilot Prompts](../prompts/) - Reusable prompt templates
- [Copilot Blueprints](../blueprints/) - Code generation blueprints
