# GitHub Copilot Instructions

> 專為 GitHub Copilot 和 AI 編碼助手設計的編碼標準與最佳實踐指令

---

## ⚠️ 重要通知

**專案治理文件已遷移至**：[`../governance/`](../governance/)

以下檔案已移至新位置：
- ~~CONTRIBUTING.md~~ → [`../governance/CONTRIBUTING.md`](../governance/CONTRIBUTING.md)
- ~~CODE_OF_CONDUCT.md~~ → [`../governance/CODE_OF_CONDUCT.md`](../governance/CODE_OF_CONDUCT.md)

**以下檔案將在後續階段整合或遷移**：
- `ARCHITECTURE.md`, `DEPLOYMENT.md`, `DEVELOPMENT.md` → 將整合至對應的 AI 指令或遷移至 `docs/`

---

This directory contains behavior instructions that guide GitHub Copilot's code generation and assistance for the GigHub project.

## 📋 Instruction Files

### Language & Framework Specific

- **angular.instructions.md** - Angular 20 development patterns and best practices
- **typescript-5-es2022.instructions.md** - TypeScript 5.x coding standards
- **sql-sp-generation.instructions.md** - SQL stored procedure patterns
- **shell.instructions.md** - Shell scripting guidelines

### Code Quality & Standards

- **code-review-generic.instructions.md** - General code review standards
- **code-review-standards.instructions.md** - Specific code review standards
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
