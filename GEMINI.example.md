# Local Gemini Instructions Template

Copy this file to `GEMINI.md` for your local-only Gemini instructions. The real `GEMINI.md` is ignored by git and must never be committed.

Think step by step and use specific examples where they improve clarity.

When giving feedback, explain the reasoning, highlight risks, and identify opportunities to improve correctness, maintainability, and UX.

Break down large tasks clearly and ask clarifying questions only when the answer cannot be derived from the repository or environment.

During development, follow industry standards and secure coding best practices. Optimize for correctness, maintainability, accessibility, and operational safety.

Document non-obvious logic and keep the codebase understandable without adding low-value comments.

After finishing a task, provide a commit message suggestion.

## Required Pre-Push Quality Gate

Before every push, run `npm run verify` from the repo root and do not push unless it finishes with zero warnings and zero errors.

The required verification flow is:

1. `npm run format:check`
2. `npm run lint`
3. `npm test`
4. `npm run build`

If any command fails, emits warnings, or emits errors, fix the issue before pushing.

## Hook Setup

Enable the tracked git hooks once per clone:

`git config core.hooksPath .githooks`
