---
title:
  'Building performance-critical Python tools with Rust: Lessons from production'
description: |-
  Python dominates web development, but they often comes with performance and
  scaling issues. Recently, the Python ecosystem has seen massive performance gains
  from projects written in Rust, such as uv and ruff. But what other projects
  are out there to help Python scale thanks to Rust? At Cloudsmith, we achieved 2x
  throughput on our 10-year-old Django monolith by integrating Rust-based tools and
  contributed features back upstream.

  We'll look at a number of projects that helped us start bringing Rust into our
  stack. We'll go over our methodology: establishing performance baselines through
  load testing, identifying bottlenecks, and scaling issues. We integrated existing
  Rust-based tools with minimal code changes and tuned application server
  configuration for maximum throughput, consolidating infrastructure and reducing
  operational complexity.

  We'll also share our experience contributing observability features upstream to
  Granian, ensuring production-ready monitoring that benefits the entire
  community.

  You'll leave with actionable strategies for modernising legacy services using
  existing Rust tools, understanding when this approach makes sense, and
  maintaining production reliability throughout the transition.

  Projects we used:
    • https://github.com/emmett-framework/granian
    • https://pyo3.rs/
    • https://github.com/ijl/orjson
author: 'Cian Butler <cbutler@cloudsmith.io>'
date: 2025-02-01T13:00:00Z
slideOptions:
  theme: cloudsmith
---

<section data-background-image="/presentation/img/rust-building-performance-critical-python-apps/cover.svg" data-background-size="cover">
<aside class="notes">

- Your Rust tools doubled our throughput on 110M req/day Django monolith
- No rewrites—just Granian, orjson, jsonschema-rs
- This talk: what adoption looks like from the consumer side

</aside>
</section>

---

## About Cloudsmith

**Universal package management & supply chain security**

- Secure artifact repository for 32+ package formats
- **110M+ API requests/day**
- **Petabytes of packages daily**
- 10-year-old Django monolith

Every non-cached request hits our Django API ⚡

Notes:

- Scale context: 110M req/day, petabytes daily
- Legacy Django
- Every request matters — your tools impact real users

---

## The Problem

```
┌─────────┐    ┌──────────┐    ┌────────┐
│  NGINX  │───▶│ HAProxy  │───▶│ uWSGI  │───▶ Django
└─────────┘    └──────────┘    └────────┘
SSL + Basic    Queuing &        App
Validation     Routing          Server
```

- Multiple components to maintain and run = debugging hell
- uWSGI threading model = black box latency spikes
- No request cancellation (WSGI limitation)
- Throwing hardware at scaling problems

Notes:

- Classic Python infra: NGINX → HAProxy → uWSGI → Django
  - Nginx doing SSL termination and basic req validation
  - HAProxy for queueing
- Pain points: debugging complexity, threading opacity, green threading

---

## Why This Matters

- ❌ Full rewrites aren't viable (10 years of business logic)
- ❌ Limited engineering bandwidth
- ✅ Need performance gains NOW
- ✅ Must maintain reliability

**The question:** Can we get massive wins without rewriting everything?

Notes:

- Rewrites is a no go, years of accumulated edge cases, logic that no one know
  why it is but its important
- Rust tools that integrate easily WIN adoption
- Minimal code changes = maximum uptake

---

## The Methodology

1. **Measure everything** — baselines before changes
2. **Identify bottlenecks** — profile & trace first
3. **Find existing Rust tools** — don't reinvent
4. **Test extensively** — months in lower envs
5. **Phased rollout** — canary by region
6. **Monitor & iterate** — production differs

**What matters:** Minimal code changes, maximum impact

Notes:

- We arnt pulling in rust just for the sake of it. Though we may make that joke
- Clear bottleneck → search for native modules alternatives with a preference to
  Rust solution
- Testing timeline: vary, lower the stack longer we test.
- Tools that require big changes get skipped

===

## Finding the Bottleneck

**Our tools:**

- Datadog & OpenTelemetry traces & metrics
- **Loadtesting:**
  1. **Locust** ❌ — Couldn't generate enough load
  2. **wrk** ❌ — Same problem
  3. **Goose** ✅ — Rust-based, actually stressed our system

Notes:

- Used Datadog and OpenTelemetry to trace requests end-to-end
- Python load testers hit ceiling before our system did.
  - We had to spin up so many workers the operation cost became annoying
- WRK was able to push the load but automating complex senarios with the lua
  became to much
- Goose (Rust) could actually find real limits with a defined user senatios

===

**What we found:**

- Application server layer was where we spent all out time
- uWSGI was causing weird latency spikes
- serialization overhead everywhere (JSON & XML)
- Complex proxy chain adding latency

**No single "aha moment"** - we all knew it was complicated

Notes:

- Multiple small issues → compound improvement opportunity

---

## The Rust Tools we used

1. **Granian** — Tokio/Hyper-based ASGI/WSGI server
2. **orjson** — PyO3-based JSON serialization
3. **jsonschema-rs** — High-performance validation

Each solves a specific bottleneck with minimal integration effort

Notes:

- Granian: replaces NGINX + HAProxy + uWSGI stack
- orjson: drop-in json replacement via PyO3
- jsonschema-rs: validation at Rust speed
- We also started to use Prek and Uv to speed up our dev env
- Small wins compounded

===

## orjson: Drop-in JSON Performance

**What it does:** PyO3-based JSON serialization

**Where we used it:**

- Django REST Framework responses
- python-json-logger integration
- Every `json.dumps()` / `json.loads()` call

===

**Integration:**

**Before**

```python
import json
data = json.dumps(payload)
```

**After**

```python
import orjson
data = orjson.dumps(payload)
```

**Surprises:**

- ✅ Near-zero compatibility issues
- ⚠️ One edge case (customer parsing JSON manually in bash)

Notes:

- Easy Win, Simple swap: import → replace → done.
- Manual code review only — grep + discipline, no LLMs.
- Rollout went smoothly.
- One customer had custom Bash JSON parsing — noticed slight format change.
  - Still valid JSON; just faster.
  - They dropped their parser — happy outcome.

===

## jsonschema-rs: The Accidental Win

**Discovery:** We were running BOTH Python jsonschema AND jsonschema-rs

**Fix:** Remove the Python one

**Result:** Free performance win

Notes:

- This is a funny story.
- We discovered we were actually running both the Python jsonschema library AND
  jsonschema-rs
- we had migrated some code but not all calls to it
- Clearly worked in prod just replaced all calls

---

## Granian: Tokio/Hyper for Python

**What it is:** Rust HTTP server for Python (ASGI/WSGI) Built on Tokio async
runtime + Hyper HTTP

**What it replaced:**

BEFORE: NGINX → HAProxy → uWSGI → Django

AFTER: Granian → Django

Notes:

- Granian uses your async runtime (Tokio) + HTTP stack (Hyper)
- We chose it because i could READ THE CODE
- Familiarity = ability to debug and contribute
- Active development & responsive maintainer
- Replaced THREE components with one Rust binary

===

## Loadtest: uWSGI vs Granian

| Metric                | uWSGI    | Granian  | Improvement |
| --------------------- | -------- | -------- | ----------- |
| **Throughput (RPS)**  | 18.38    | 24.20    | **+32%**    |
| **Avg Response Time** | 6,985ms  | 3,837ms  | **-45%**    |
| **P50 Latency**       | 7,000ms  | 3,000ms  | **-57%**    |
| **P95 Latency**       | 11,000ms | 12,000ms | +9%         |
| **Total Requests**    | 18,124   | 23,235   | +28%        |

**Test:** 0-200 concurrent users, 16 minutes (Goose v0.17.2)

Notes:

- Staging test: just app servers head-to-head
- 32% throughput, 45% faster average, 57% faster median
- P95/P99 slightly up = handling more traffic at tail
- uWSGI had zero errors — this is additive, not trade-off

===

## Loadtest: Full Stack (The Real Win)

| Metric                | NGINX/HAProxy/uWSGI | Granian | Improvement    |
| --------------------- | ------------------- | ------- | -------------- |
| **Throughput (RPS)**  | 70.89               | 144.39  | **+104% (2x)** |
| **Avg Response Time** | 1,799ms             | 841ms   | **-53%**       |
| **P50 Latency**       | 1,000ms             | 500ms   | **-50%**       |
| **P95 Latency**       | 5,000ms             | 3,000ms | **-40%**       |
| **P99 Latency**       | 7,000ms             | 4,000ms | **-43%**       |
| **Total Requests**    | 69,828              | 142,225 | +104%          |

✅ **2x throughput** ✅ **50%+ latency reduction**

Notes:

- Full stack comparison: this is the real impact
- 2x throughput = handle double the traffic, same hardware
- P50 halved = typical users see 2x faster responses

---

## The Migration Journey

**Timeline:** Months from testing → production

**Phased rollout:**

1. Staging rollout
2. Internal environment validation
3. Canary deployment by region
4. Gradual rollout over days

**Why:** 110M requests/day = high-stakes change

Notes:

- Not "looks good" → "deploy everywhere"
- staging, internal then canary by region in prod
- We had e2e test that passed, but so much logic that we wanted to be sure.

---

## What Broke: Threading Model Differences

### **1. Database Connection Exhaustion** 💥

**Root cause:** Django 4's "pooling" = just connection reuse

- Granian's true threading: each thread spawns connections
- uWSGI green threads: better connection sharing

**Fix:**

- Django 5.1's real connection pooling
- Still in progress (why Granian isn't at 100%)

Notes:

- Threading model differences matter for Python interop
- uWSGI green threads vs Granian OS threads = different resource patterns
- Django 5.1 fixes this properly
- tried RDSProxy but got some insane latency spike waiting on connections

===

## What Broke: HTTP Strictness

### **2. HTTP Handling Differences**

**Root cause:** NGINX normalizes quirky HTTP silently

- Hyper does Everything correctly
- AWS ALB couldnt handle the weird responses

**Fix:** We are isolating this logic out and following specs

Notes:

- Package managers are weird.
- They do weird things like expecting a body size on a 307 that matches the size
  of the thing after the 307.
- Nginx is doing something weird to make this work.

===

## What Broke: Debugger Support

### **3. Development Workflow**

**Problem:** Can't attach Python debugger to Granian

**Workaround:** Using a different server in dev

Notes:

- Can't pdb into Granian processes
- Not likle we used uwsgi in dev either.

---

## Tuning: Granian

**Key parameters:**

```
granian --interface wsgi \
        --workers 8 \
        --threads 4 \           # blocking-threads
        --backlog 2048 \        # connection queue
        app:application
```

- **Backlog:** Max connections to hold in queue
- **Threads:** Per-worker blocking I/O threads
- **Workers:** Process count

**Goal:** Recreate HAProxy's queue without HAProxy

Notes:

After lots of playing around we found some values that worked and replicated the
HAProxy within Granians main eventloop

---

## Contributing Back to Granian.

**What we needed:** Production observability

**What was Missing:** Metrics

**What we did:**

- Forked, added Prometheus metrics endpoint
- Exposed backlog depth, event loop stats
- Open a PR (never got it merged)

**Status:** Will be in the next release

Notes:

- Realized we were flying blind
  - We needed replicate our HAProxy visibility
  - Needed: backlog depth, event loop saturation
- Forked and added metrics ourselves
- We never had time to address the concerns.
- as of Friday(?) the maintainer got to implement the features and it'll be in
  the next release

---

## Where We Are Today

**Granian deployment:**

- ✅ Running in Internal Envs
- ⏳ Not 100% yet (Django upgrade in progress)
- ✅ Debugging easier than uWSGI black box
- ✅ Performance gains confirmed

**Rust In the stack:**

- orjson: ✅ Everywhere
- jsonschema-rs: ✅ Everywhere
- Granian: ⏳ Phased rollout

Notes:

- Canary regions running Granian NOW
- 2x throughput confirmed in production
- Not 100% = being careful, not failed
- orjson/jsonschema-rs = stable, invisible, just work

---

## Cultural Shift

This gave us confidence to to experiment more

Build new services in pure Rust

Notes:

- Started: "Rust is scary, that's systems programming"
- Successful integrations build organizational confidence
- You're not just writing libraries — you're shifting ecosystems
- managed to convince a pure python shop to let to build a service in RUST

---

## Where Rust-Python Tools Win

**Good fit when you have:**

- ✅ Clear performance bottleneck exists
- ✅ Drop-in API compatibility

Notes:

- Best targets: clear bottleneck + easy integration
- API compatibility is HUGE for adoption
- Active maintainers matter — we needed Giovanni's help
- Complex integrations get deprioritized

---

## Thank You!

**Questions?**

**Cian Butler** — Senior SRE @ Cloudsmith 📧 cbutler@cloudsmith.io

**tl;dr:** Your Rust tools gave us 2x throughput on 110M req/day. No rewrites.
Just good libraries.

Notes:

- 2x throughput, half the latency, simpler architecture
- Your libraries made this possible
- Happy to discuss: adoption patterns, contribution opportunities, Cloudsmith
- We're hiring: cloudsmith.com/careers
