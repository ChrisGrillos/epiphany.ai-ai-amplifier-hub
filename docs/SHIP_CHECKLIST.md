# Ship Checklist

## Build and Static Checks
- [ ] `npm run build` passes on current branch
- [ ] No unresolved merge conflicts or local debug code

## Core Flow Validation
- [ ] Create vault
- [ ] Start session
- [ ] Send message in main chat
- [ ] End session and accept synthesis
- [ ] Attach reference
- [ ] Accept reference diff and confirm `Reference` updates

## Provider and AI Routing
- [ ] Switch active provider in API Keys modal
- [ ] Confirm main chat uses selected provider
- [ ] Confirm Epi tab still responds and logs actions

## Session Safety
- [ ] Autosave creates one active autosave record for a session
- [ ] Subsequent autosaves update same record (no duplicates)
- [ ] Manual synthesis acceptance marks autosave as `superseded`

## Feature Label Honesty
- [ ] Bridge areas visibly marked Experimental
- [ ] Social areas visibly marked Demo
- [ ] No copy claims production-grade guarantees for demo paths

## Data and Backend Readiness
- [ ] Base44 entities created per `SETUP.md`
- [ ] `llmProxy` deployed and reachable
- [ ] `entityGuard` deployed and enforcing ownership

## Release Notes Prep
- [ ] Document notable behavior changes
- [ ] Capture known limitations (experimental/demo areas)
- [ ] Include rollback plan (last known good commit)
