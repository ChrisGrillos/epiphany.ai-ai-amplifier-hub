# Epiphany.AI — Setup Guide

This guide walks through everything you need to get Epiphany.AI running from a fresh clone.

---

## Step 1: Base44 Account

1. Create a free account at [base44.com](https://base44.com)
2. Create a new app (name it anything — "Epiphany AI" works)
3. Note your **App ID** and **Base URL** from the app settings

---

## Step 2: Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_BASE44_APP_ID=your_actual_app_id
VITE_BASE44_APP_BASE_URL=https://your-app-name.base44.app
```

---

## Step 3: Create Entities

In your Base44 dashboard, go to **Entities** and create each of the following. Field types are noted in parentheses.

### Vault
| Field | Type |
|-------|------|
| name | text |
| description | text |
| living_summary | text (long) |
| last_accessed | datetime |
| run_guardian_after_synthesis | boolean |
| live_insights_level | number |

### Session
| Field | Type |
|-------|------|
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
|-------|------|
| vault_id | text |
| filename | text |
| full_content | text (long) |
| excerpt | text |
| file_type | text |

### AppSettings
| Field | Type |
|-------|------|
| epi_level | number |
| active_provider | text |
| encrypted_key_grok | text |
| encrypted_key_openai | text |
| encrypted_key_anthropic | text |
| encrypted_key_custom | text |
| encrypted_extra_custom | text |

### EpiLog
| Field | Type |
|-------|------|
| vault_id | text |
| action | text |
| epi_level | number |
| metadata | json |
| result | text |

### TutorialProgress
| Field | Type |
|-------|------|
| tutorial_active | boolean |
| completed_steps | json |
| current_step | text |
| dismissed | boolean |

### VaultMember
| Field | Type |
|-------|------|
| vault_id | text |
| user_email | text |
| role | text |

### VaultComment
| Field | Type |
|-------|------|
| vault_id | text |
| content | text |
| user_email | text |

### Workflow
| Field | Type |
|-------|------|
| vault_id | text |
| name | text |
| steps | json |
| status | text |

### ScheduledPost
| Field | Type |
|-------|------|
| vault_id | text |
| content | text |
| platform | text |
| scheduled_at | datetime |
| status | text |

### MoltbookAgent
| Field | Type |
|-------|------|
| vault_id | text |
| name | text |
| personality | text |
| model | text |
| provider | text |

### BridgeConversation
| Field | Type |
|-------|------|
| vault_id | text |
| title | text |
| messages | json |
| source | text |
| imported_at | datetime |

---

## Step 4: Deploy Server Functions

In your Base44 dashboard, go to **Functions** and create two functions:

### Function 1: `llmProxy`
- Name: `llmProxy`
- Paste the contents of `functions/llmProxy.ts`
- This handles all LLM API calls with encrypted key management

### Function 2: `entityGuard`
- Name: `entityGuard`
- Paste the contents of `functions/entityGuard.ts`
- This enforces entity ownership on the server side

---

## Step 5: Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Step 6: First Use

1. The onboarding tutorial will walk you through the basics
2. Create your first Vault
3. (Optional) Configure API keys: click the 🔑 button to add keys for Grok, OpenAI, or Anthropic
4. Start a session and chat — the built-in Base44 LLM works without any API key
5. End the session to trigger synthesis — review the proposed Living Summary update

---

## Publishing to Production

In your Base44 dashboard, click **Publish** to deploy the app to your Base44 subdomain. The app will be accessible at your `VITE_BASE44_APP_BASE_URL`.

Alternatively, connect the GitHub repo to Base44 for automatic deploys on push.

---

## Troubleshooting

**"Unauthorized" errors**: Make sure you're logged into Base44 and the `.env.local` values match your app.

**LLM calls failing**: Check that the `llmProxy` function is deployed and that you've saved a valid API key through the in-app settings.

**Entities not found**: Verify all entities are created with the exact names listed above (case-sensitive).

**Blank screen on load**: Check the browser console. Usually a missing entity or env variable.
