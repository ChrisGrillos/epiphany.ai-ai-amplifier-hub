# BASE44 Handoff

## Purpose
This document summarizes how the frontend currently uses Base44 so a new maintainer can take over quickly.

## Runtime Architecture
- Frontend: React + Vite + TanStack Query
- Data: Base44 entities (user-scoped from frontend where applicable)
- AI calls: `llmProxy` function via `workflowEngine` utilities and selective direct `Core.InvokeLLM` calls
- Ownership: frontend scoping helper + `entityGuard` backend function

## Required Base44 Functions
1. `llmProxy`
- Handles provider key status, active provider, and LLM invocation.
- Main chat now uses active provider from this function.

2. `entityGuard`
- Enforces ownership constraints for entity reads/writes.

## Core User Flow Dependencies
1. Create vault: `Vault.create`
2. Start session: local session state + `Vault.update(last_accessed)`
3. Send messages: `Session` auto-save/update + provider-backed LLM calls
4. End session and accept synthesis: `Vault.update(living_summary)` + `Session.create(completed)`
5. References: `Reference.create/update/delete`, attach IDs in session metadata

## Current Feature Maturity Notes
- Bridge surfaces are marked Experimental.
- Social surfaces are marked Demo (mock/local pieces still present).
- Queue publishing path includes demo/mock IDs in current implementation.

## Entity Summary
See [SETUP.md](../SETUP.md) for the canonical field list used by the frontend.

## Operational Notes
- Build command: `npm run build`
- Dev command: `npm run dev`
- Provider switching source of truth: `llmProxy` active provider status

## High-Value Validation After Changes
1. Provider switch changes main chat provider behavior.
2. Session autosave updates a single autosave record per active session.
3. Synthesis acceptance persists summary and completed session.
4. Reference diff acceptance updates the `Reference` entity.
