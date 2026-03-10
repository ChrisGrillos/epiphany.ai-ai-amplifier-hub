# Epiphany.AI - Setup Guide

This guide matches the current frontend entity usage.

---

## Step 1: Base44 Account

1. Create an account at [base44.com](https://base44.com)
2. Create a new app
3. Copy your **App ID** and **Base URL** from app settings

---

## Step 2: Environment Variables

```bash
cp .env.example .env.local
```

Set `.env.local`:

```env
VITE_BASE44_APP_ID=your_actual_app_id
VITE_BASE44_APP_BASE_URL=https://your-app-name.base44.app
```

---

## Step 3: Create Entities

Important:
- Entity names are case-sensitive
- `created_by` is platform-managed and used by frontend scoping logic

### Vault
| Field | Type |
|---|---|
| name | text |
| description | text |
| living_summary | text (long) |
| last_accessed | datetime |
| run_guardian_after_synthesis | boolean |
| live_insights_level | number |

### Session
| Field | Type |
|---|---|
| vault_id | text |
| title | text |
| messages | json |
| status | text |
| started_at | datetime |
| ended_at | datetime |
| attached_reference_ids | json |
| synthesis_result | json |
| source | text |
| import_source_name | text |

### Reference
| Field | Type |
|---|---|
| vault_id | text |
| filename | text |
| full_content | text (long) |
| excerpt | text |
| file_type | text |
| file_url | text |
| size | number |
| archived | boolean |
| archival_reason | text |
| last_accessed | datetime |
| usage_count | number |

### AppSettings
| Field | Type |
|---|---|
| epi_level | number |

### EpiLog
| Field | Type |
|---|---|
| vault_id | text |
| action | text |
| epi_level | number |
| metadata | json |
| result | text |

### TutorialProgress
| Field | Type |
|---|---|
| tutorial_active | boolean |
| completed_steps | json |
| current_step | text |
| dismissed | boolean |

### VaultMember
| Field | Type |
|---|---|
| vault_id | text |
| user_email | text |
| role | text |
| invited_by | text |
| last_seen | datetime |
| user_name | text |

### VaultComment
| Field | Type |
|---|---|
| vault_id | text |
| target_type | text |
| target_id | text |
| author_email | text |
| author_name | text |
| text | text |
| resolved | boolean |

### Workflow
| Field | Type |
|---|---|
| vault_id | text |
| name | text |
| description | text |
| trigger_type | text |
| steps | json |
| status | text |

### ScheduledPost
| Field | Type |
|---|---|
| vault_id | text |
| platform | text |
| draft | text |
| hashtags | json |
| tone | text |
| account_handle | text |
| scheduled_at | datetime |
| status | text |
| published_at | datetime |
| platform_post_id | text |
| comments | json |
| activity_log | json |
| assigned_to | text |
| approval_status | text |

### MoltbookAgent
| Field | Type |
|---|---|
| vault_id | text |
| agent_id | text |
| agent_name | text |
| description | text |
| api_endpoint | text |
| capabilities | json |
| connection_type | text |
| status | text |
| trusted | boolean |
| last_interaction | datetime |

### BridgeConversation
| Field | Type |
|---|---|
| vault_id | text |
| title | text |
| context_level | text |
| participants | json |
| messages | json |
| bridge_url | text |
| status | text |
| source | text |
| imported_at | datetime |

---

## Step 4: Deploy Server Functions

Create these Base44 functions:

### `llmProxy`
- Name: `llmProxy`
- Source: `functions/llmProxy.ts`
- Purpose: provider key management + LLM invocation proxy

### `entityGuard`
- Name: `entityGuard`
- Source: `functions/entityGuard.ts`
- Purpose: ownership enforcement for entity access

---

## Step 5: Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Step 6: First Use

1. Complete onboarding/tutorial
2. Create a vault
3. Optionally configure provider keys in API Keys modal
4. Start a session and send messages
5. End session and review synthesis

---

## Publishing

Use Base44 Publish in dashboard, or connect GitHub for deploy-on-push.

---

## Troubleshooting

- Unauthorized errors: verify Base44 login and env vars
- LLM errors: confirm `llmProxy` is deployed and provider/key is configured
- Missing entities: verify names and fields above exactly
- Blank UI: inspect browser console and network requests
