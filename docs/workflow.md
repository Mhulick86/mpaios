# mpaios ↔ openclaw workflow

Inferred from the public exports of `openclaw@2026.4.15` and its npm
description ("WhatsApp gateway CLI (Baileys web) with Pi RPC agent").
Treat as a map, not a spec — confirm against upstream docs before wiring
production logic.

## 1. Startup

```mermaid
flowchart TD
    Dev([pnpm dev / start]) --> Entry["src/index.ts<br/>mpaios consumer"]
    Entry -->|import| OC["openclaw package"]

    subgraph Boot["openclaw boot sequence"]
      direction TB
      LC["loadConfig()"] --> RSK["resolveSessionKey<br/>deriveSessionKey"]
      RSK --> EPA["ensurePortAvailable<br/>(describePortOwner on conflict)"]
      EPA --> LSS["loadSessionStore<br/>(resolveStorePath)"]
      LSS --> RLE["runLegacyCliEntry()"]
    end

    OC --> Boot
    EPA -. PortInUseError .-> HPE["handlePortError"]

    RLE --> WA["Baileys WhatsApp<br/>Web client"]
    RLE --> MWC["monitorWebChannel<br/>(Pi RPC agent)"]
```

## 2. Inbound message → reply

```mermaid
sequenceDiagram
    autonumber
    actor User as WhatsApp user
    participant WA as Baileys client
    participant Core as openclaw core
    participant RPC as Pi RPC agent<br/>(monitorWebChannel)
    participant Cfg as config +<br/>templates
    participant Store as session store

    User->>WA: message (phone → normalizeE164)
    WA->>Core: onMessage
    Core->>Cfg: getReplyFromConfig
    alt template hit
        Cfg->>Core: applyTemplate(vars)
    else needs exec
        Core->>Core: runExec / runCommandWithTimeout
    end
    Core->>RPC: forward if agent-bound
    RPC-->>Core: agent reply
    Core->>WA: send reply
    WA->>User: message
    Core->>Store: saveSessionStore
```

## 3. Where mpaios plugs in

```mermaid
flowchart LR
    subgraph mpaios
      idx["src/index.ts"]
    end
    subgraph openclaw_api["openclaw exports"]
      direction TB
      A["loadConfig"]
      B["runLegacyCliEntry"]
      C["monitorWebChannel"]
      D["applyTemplate /<br/>getReplyFromConfig"]
      E["saveSessionStore"]
    end

    idx -->|"boot the CLI<br/>as-is"| B
    idx -->|"override replies"| D
    idx -->|"observe channel"| C
    idx -->|"read user config"| A
    idx -->|"persist state"| E
```

## Assumptions & caveats

- Export names suggest intent; actual call order and signatures need
  verification against the package source under
  `node_modules/openclaw/dist/`.
- `runLegacyCliEntry` likely encapsulates the full boot + message loop;
  most consumers won't call the lower-level helpers directly.
- The Pi RPC agent is treated as an optional parallel channel; it may be
  gated by config.
