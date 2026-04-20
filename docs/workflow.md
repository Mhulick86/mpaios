# mpaios ↔ openclaw workflow

Grounded in `openclaw@2026.4.15` — package manifest describes it as a
*"Multi-channel AI gateway with extensible messaging integrations"*.
The name is **open Cla(ude)**: Claude is the brain, openclaw is the
multi-channel body that plugs it into any messaging platform.

## 1. Architecture

openclaw's core is a switchboard. Everything pluggable lives under
`node_modules/openclaw/dist/extensions/` as either a **channel** (where
the user talks) or a **provider** (the LLM doing the thinking).

```mermaid
flowchart LR
    subgraph channels["channel plugins"]
      direction TB
      CH1["whatsapp<br/>(Baileys)"]
      CH2["telegram"]
      CH3["slack / discord /<br/>imessage / signal /<br/>matrix / …"]
    end

    subgraph core["openclaw core"]
      direction TB
      Router["router<br/>(getReplyFromConfig,<br/>applyTemplate)"]
      Session["session store<br/>(loadSessionStore,<br/>saveSessionStore)"]
      Exec["runExec /<br/>runCommandWithTimeout"]
    end

    subgraph providers["provider plugins"]
      direction TB
      ANT["anthropic<br/>(claude-* models)"]
      OAI["openai"]
      GOO["google / bedrock /<br/>vertex / groq /<br/>ollama / …"]
    end

    channels <-->|inbound msg /<br/>outbound reply| core
    core -->|chosen by model prefix| providers
```

## 2. Startup

```mermaid
flowchart TD
    Dev([pnpm dev / start]) --> Entry["src/index.ts<br/>mpaios consumer"]
    Entry -->|import 'openclaw'| OC["openclaw package"]

    subgraph Boot["openclaw boot"]
      direction TB
      LC["loadConfig()"] --> RSK["resolveSessionKey /<br/>deriveSessionKey"]
      RSK --> EPA["ensurePortAvailable"]
      EPA --> LSS["loadSessionStore"]
      LSS --> Plugins["load enabled<br/>channel + provider plugins"]
      Plugins --> RLE["runLegacyCliEntry()"]
    end

    OC --> Boot
    EPA -. PortInUseError .-> HPE["handlePortError<br/>(describePortOwner)"]

    RLE --> Listen["channel listeners<br/>+ monitorWebChannel"]
```

## 3. User question → Claude reply

This is the path for a free-form question (no static template match).

```mermaid
sequenceDiagram
    autonumber
    actor User as user
    participant Ch as channel plugin<br/>(e.g. whatsapp)
    participant Core as openclaw core
    participant Prov as anthropic plugin
    participant Claude as Claude<br/>(CLI subprocess<br/>or Anthropic API)
    participant Store as session store

    User->>Ch: message
    Ch->>Core: onMessage(normalizeE164 sender, text)
    Core->>Core: getReplyFromConfig
    alt static template hit
        Core->>Ch: applyTemplate(vars)
    else route to LLM
        Core->>Prov: request (model: claude-*, history)
        alt cliBackends = ["claude-cli"]
            Prov->>Claude: spawn `claude` subprocess<br/>(reuses local CLI login)
        else API key set
            Prov->>Claude: POST api.anthropic.com/v1/messages<br/>(ANTHROPIC_API_KEY)
        end
        Claude-->>Prov: completion
        Prov-->>Core: reply text
        Core->>Ch: send reply
    end
    Ch->>User: message
    Core->>Store: saveSessionStore
```

Auth for the anthropic plugin (from
`dist/extensions/anthropic/openclaw.plugin.json`):

- `anthropic-cli` — reuse a local Claude CLI login on this host
  (uses `ANTHROPIC_OAUTH_TOKEN`)
- `api-key` — direct API with `ANTHROPIC_API_KEY` / `--anthropic-api-key`

Model selection is by prefix: any model starting with `claude-` is
routed to the anthropic plugin.

## 4. Where mpaios plugs in

```mermaid
flowchart LR
    subgraph mpaios
      idx["src/index.ts"]
    end
    subgraph openclaw_api["openclaw surface"]
      direction TB
      B["runLegacyCliEntry<br/>(full CLI boot)"]
      A["loadConfig"]
      D["applyTemplate /<br/>getReplyFromConfig"]
      C["monitorWebChannel"]
      E["saveSessionStore"]
      P["openclaw/plugin-sdk"]
    end

    idx -->|"boot as-is"| B
    idx -->|"read config"| A
    idx -->|"custom replies"| D
    idx -->|"watch channel"| C
    idx -->|"persist"| E
    idx -->|"add a channel or<br/>provider plugin"| P
```

For deep customization (new channel, new provider, new skill), depend
on the `openclaw/plugin-sdk` subpath export rather than hacking on
core.

## 5. Marketing layer

```mermaid
flowchart LR
    subgraph AuthorTime[".claude/skills (author-time)"]
      PMC[product-marketing-context]
      CW[cold-whatsapp-outreach]
      WS[whatsapp-sequence]
      CR[customer-research]
      CP[churn-prevention]
      COPY[copywriting / copy-editing]
      GROW[launch / referral / analytics / ab-test]
    end

    subgraph Runtime["src/marketing (runtime)"]
      LS[loadSkill]
      T1[templates/coldWhatsapp]
      T2[templates/whatsappSequence]
      T3[templates/churnWinback]
      T4[templates/inboundSurvey]
    end

    subgraph OC[openclaw]
      APPLY[applyTemplate]
      GETREPLY[getReplyFromConfig]
      SESSION[session store]
      MON[monitorWebChannel]
    end

    CW --> T1 --> APPLY
    WS --> T2 --> APPLY
    CP --> T3 --> MON
    CR --> SESSION
    LS --> AuthorTime
    T2 --> SESSION
```

Author-time skills prime Claude Code with mpaios voice and workflows.
Runtime templates compile those workflows into deterministic functions
(`advanceSequence`, `evaluateChurnRisk`, `stepSurvey`) that openclaw
can call from its reply loop.

## 6. Quick Actions orchestrator

Each Quick Action button POSTs to a serverless endpoint under
`api/quick-actions/`. A local LM Studio model plans the request, a
specialist executes it, and the plan falls back to the local model when
a specialist is unreachable or its key is missing.

```mermaid
flowchart TD
    UI[["Quick Actions UI<br/>(Audit GBP / Check Citations /<br/>Review Generation / Competitor Scan)"]]
    UI -->|POST /api/quick-actions/&lt;name&gt;| H["quickActionHandler"]
    H --> D["dispatch(task)"]

    D --> P["planner<br/>(src/orchestrator/planner.ts)"]
    P -->|JSON: specialist + model| LM["LM Studio<br/>(OPENAI-compat /v1)"]
    P -->|plan| X["execute(plan)"]

    X -->|anthropic| A["@anthropic-ai/sdk<br/>claude-opus-4-7<br/>adaptive thinking +<br/>prompt caching"]
    X -->|openai| O["OpenAI API<br/>gpt-4o-mini<br/>JSON mode"]
    X -->|google| G["Gemini API<br/>gemini-2.0-flash<br/>JSON mode"]
    X -->|local| L["LM Studio<br/>(OpenAI-compat)"]

    A -- error / no key --> L
    O -- error / no key --> L
    G -- error / no key --> L

    X --> R["parse + validate<br/>(per-action schema)"]
    R -->|DispatchResult JSON| UI
```

Defaults per action (overridable by the planner or by env keys):

| Action | Default specialist | Model |
| --- | --- | --- |
| `audit-gbp` | google | `gemini-2.0-flash` |
| `check-citations` | local | LM Studio loaded model |
| `review-generation` | anthropic | `claude-opus-4-7` |
| `competitor-scan` | openai | `gpt-4o-mini` |

The planner is the only mandatory LM Studio call — specialists are
optional and each degrades to local if their key is absent or the
provider errors.
