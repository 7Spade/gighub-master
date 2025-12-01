# GitHub Copilot Resources Summary

This document summarizes the GitHub Copilot prompts, instructions, and agents that have been integrated into this project from [github/awesome-copilot](https://github.com/github/awesome-copilot).

## Project Context

This is a **GigHub** application built with:
- **Frontend**: Angular (NG-ALAIN framework)
- **Backend**: Supabase (PostgreSQL)
- **Database Schema**: Multi-tenant SaaS with Role-Based Access Control (RBAC)

The database schema in `supabase/seeds/init.sql` includes:
- Accounts (user/org/bot)
- Organizations with team management
- Blueprints (workspaces) with member access control
- Tasks, Diaries, Checklists, Issues modules
- Row Level Security (RLS) policies

---

## 📋 Prompts (`.github/copilot-prompts/`)

### Development Planning
| Prompt | Description | Use Case |
|--------|-------------|----------|
| `create-specification.prompt.md` | Creates detailed specification files | Define feature requirements before coding |
| `create-implementation-plan.prompt.md` | Generates structured implementation plans | Plan tasks with phases and dependencies |
| `breakdown-plan.prompt.md` | Breaks down epics into features and tasks | Sprint planning with GitHub issues |
| `create-architectural-decision-record.prompt.md` | Documents ADRs | Record architecture decisions |
| `architecture-blueprint-generator.prompt.md` | Generates architecture documentation | System design documentation |

### SQL Development
| Prompt | Description | Use Case |
|--------|-------------|----------|
| `sql-optimization.prompt.md` | Optimizes SQL queries | Improve query performance |
| `sql-code-review.prompt.md` | Reviews SQL code quality | Validate SQL against best practices |

### Code Quality
| Prompt | Description | Use Case |
|--------|-------------|----------|
| `review-and-refactor.prompt.md` | Code review and refactoring suggestions | Improve code quality |
| `conventional-commit.prompt.md` | Generates conventional commit messages | Consistent commit history |
| `add-educational-comments.prompt.md` | Adds explanatory comments | Improve code documentation |
| `create-readme.prompt.md` | Generates README files | Document modules/features |

---

## 🤖 Agents (`.github/copilot-agents/`)

### Planning & Architecture
| Agent | Description | Tools |
|-------|-------------|-------|
| `plan.agent.md` | Strategic planning and architecture assistant | codebase, search, usages |
| `planner.agent.md` | Generate implementation plans | codebase, fetch, search |
| `implementation-plan.agent.md` | Detailed implementation planning | edit, search, runCommands |
| `arch.agent.md` | Architecture guidance and recommendations | codebase, search |

### Database
| Agent | Description | Tools |
|-------|-------------|-------|
| `postgresql-dba.agent.md` | PostgreSQL database administration | pgsql tools, database |

### Development
| Agent | Description | Tools |
|-------|-------------|-------|
| `api-architect.agent.md` | API design with resilience patterns | codebase |
| `debug.agent.md` | Systematic debugging assistance | edit, search, runTests |
| `code-tour.agent.md` | Code exploration and understanding | codebase, search |
| `mentor.agent.md` | Learning and guidance | codebase |
| `janitor.agent.md` | Code cleanup and maintenance | edit, search |

---

## 📚 Instructions (`.github/instructions/`)

### Language & Framework
| Instruction | Applies To | Description |
|-------------|------------|-------------|
| `angular.instructions.md` | `*.ts, *.html, *.scss` | Angular coding standards with Signals |
| `typescript-5-es2022.instructions.md` | `*.ts` | TypeScript guidelines for ES2022 |

### Database
| Instruction | Applies To | Description |
|-------------|------------|-------------|
| `sql-sp-generation.instructions.md` | `*.sql` | SQL and stored procedure guidelines |

### Quality & Security
| Instruction | Applies To | Description |
|-------------|------------|-------------|
| `code-review-generic.instructions.md` | All | Generic code review standards |
| `security-and-owasp.instructions.md` | All | OWASP security best practices |
| `a11y.instructions.md` | All | Accessibility standards |
| `performance-optimization.instructions.md` | All | Performance guidelines |

### Architecture
| Instruction | Applies To | Description |
|-------------|------------|-------------|
| `dotnet-architecture-good-practices.instructions.md` | All | DDD and SOLID principles |
| `devops-core-principles.instructions.md` | All | DevOps principles |

---

## 🔄 Recommended Workflows

### 1. Feature Development Workflow
```
1. @plan agent → Understand requirements and context
2. create-specification.prompt → Write detailed specs
3. create-implementation-plan.prompt → Plan tasks
4. breakdown-plan.prompt → Create GitHub issues
5. conventional-commit.prompt → Commit with standards
```

### 2. Database Development Workflow
```
1. @postgresql-dba agent → Design schema (aligned with init.sql)
2. sql-sp-generation.instructions → Follow SQL standards
3. sql-optimization.prompt → Optimize queries
4. sql-code-review.prompt → Review SQL code
```

### 3. Code Review Workflow
```
1. code-review-generic.instructions → Apply review standards
2. review-and-refactor.prompt → Get improvement suggestions
3. security-and-owasp.instructions → Security validation
4. @janitor agent → Code cleanup
```

### 4. Architecture Planning Workflow
```
1. @arch agent → Get architecture guidance
2. architecture-blueprint-generator.prompt → Generate docs
3. create-architectural-decision-record.prompt → Document ADRs
4. dotnet-architecture-good-practices.instructions → Apply DDD
```

### 5. Debugging Workflow
```
1. @debug agent → Systematic debugging
2. @code-tour agent → Understand code flow
3. @mentor agent → Learn from issues
```

---

## 📥 VSCode Installation Links

### Prompts
- [create-specification](vscode-insiders:chat-prompts/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/create-specification.prompt.md)
- [create-implementation-plan](vscode-insiders:chat-prompts/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/create-implementation-plan.prompt.md)
- [sql-optimization](vscode-insiders:chat-prompts/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/sql-optimization.prompt.md)
- [breakdown-plan](vscode-insiders:chat-prompts/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/breakdown-plan.prompt.md)
- [conventional-commit](vscode-insiders:chat-prompts/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/conventional-commit.prompt.md)

### Agents
- [@plan](vscode-insiders:chat-agents/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/agents/plan.agent.md)
- [@postgresql-dba](vscode-insiders:chat-agents/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/agents/postgresql-dba.agent.md)
- [@debug](vscode-insiders:chat-agents/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/agents/debug.agent.md)
- [@arch](vscode-insiders:chat-agents/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/agents/arch.agent.md)

### Instructions
- [Angular](vscode-insiders:chat-instructions/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/angular.instructions.md)
- [TypeScript](vscode-insiders:chat-instructions/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/typescript-5-es2022.instructions.md)
- [SQL](vscode-insiders:chat-instructions/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/sql-sp-generation.instructions.md)
- [Security](vscode-insiders:chat-instructions/install?url=https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/security-and-owasp.instructions.md)

---

## 💡 Tips for Effective Use

1. **Start with Planning**: Always use `@plan` agent before implementing features
2. **Use SQL Tools**: For any database work, use `@postgresql-dba` and SQL prompts
3. **Follow Standards**: Enable instructions for consistent code quality
4. **Document Decisions**: Use ADR prompts for architecture decisions
5. **Review Code**: Apply code review instructions before merging

## 📖 Additional Resources

- [GitHub Awesome Copilot](https://github.com/github/awesome-copilot)
- [Supabase Documentation](https://supabase.com/docs)
- [Angular Documentation](https://angular.dev)
- [NG-ALAIN Framework](https://ng-alain.com)
