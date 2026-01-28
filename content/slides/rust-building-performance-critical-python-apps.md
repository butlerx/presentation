---
title:
  'Building performance-critical Python tools with Rust: Lessons from production'
description: |-
  Python dominates web development, but they often comes with performance and
  scaling issues. Recently, the Python ecosystem has seen massive performance gains
  from projects written in Rust, such as uv and ruff. But what other projects
  are out there to help Python scale thanks to Rust? At Cloudsmith, we achieved 2x
  throughput on our 8-year-old Django monolith by integrating Rust-based tools and
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

This talk is about how we took an 8-year-old Django monolith running 110 million
requests a day and doubled its throughput by integrating Rust-based tools. No
rewrites needed

</aside>
</section>

---

## About Cloudsmith

**Universal package management & supply chain security**

- Secure artifact repository for over 32 package formats
- Handles **110M+ API requests/day**
- Processes **petabytes of packages daily**
- 8-year-old Django monolith at the core

Every non-cached request hits our API ⚡

---

## The Problem

```
┌─────────┐    ┌──────────┐    ┌────────┐
│  NGINX  │───▶│ HAProxy  │───▶│ uWSGI  │───▶ Django
└─────────┘    └──────────┘    └────────┘
SSL + Basic    Queuing &        App
Validation     Routing          Server
```

- Multiple components to maintain & debug
- uWSGI = black box with mysterious latency spikes
  - Threading model causing unpredictable behavior
- Can't cancel in-flight requests (WSGI limitation)
- Throwing resources at scaling problems

Notes:

Like most services that have been around 8 years, our architecture had evolved
organically. We had NGINX doing SSL termination and basic request validation,
HAProxy for queuing and routing, and uWSGI as our application server talking to
Django. The problem wasn't that these components don't work - they do. The
problem was the complexity of debugging them. We were seeing latency spikes that
we couldn't correlate to anything. We'd tune uWSGI and things would improve then
get weird again. The threading model was a black box to us. And from a business
perspective, we were paying for a lot of infrastructure to handle traffic that
could be handled more efficiently. we were curious - could we do better?

---

## Why This Matters

**Common startup constraints:**

- ❌ Can't do a full rewrite
- ❌ Limited engineering time
- ✅ Need performance gains NOW
- ✅ Must maintain reliability

**The question:** Can we get massive wins without rewriting everything?

Notes:

I want to be clear about something from the start. We couldn't rewrite our core
API in Rust. That's 8 years of business logic, edge cases, customer
customizations, and tribal knowledge. We also don't have unlimited engineering
time. What we do have is cost pressure and a curiosity about what modern Rust
tools can do. The question that drove this whole project was simple: can we get
meaningful performance improvements without throwing away years of Python code?
The answer, as we'll see, is yes. Absolutely yes.

---

## Our Methodology

1. **Measure everything** - Establish baselines
2. **Identify bottlenecks** - Profile & trace
3. **Find existing Rust tools** - Don't reinvent the wheel
4. **Test thoroughly** - Months in staging
5. **Phased rollout** - Canary by region
6. **Monitor & iterate** - Production is different

**Goal:** Minimal code changes, maximum impact

Notes:

This is the methodology that worked for us. Notice what's NOT on this list -
there's no "rewrite in Rust". Our approach was surgical. We didn't go looking
for Rust projects to use - we only investigated them after we found a
bottleneck. We didn't do a big bang deployment - we spent months testing, then
rolled out region by region. This is the approach I'd recommend. It's how you
make big performance gains without betting the company.

===

## Finding the Bottleneck

**Tools we used:**

- Datadog APM traces & metrics
- Load testing with Goose

**Discovery:**

- Application server layer = primary constraint
- uWSGI threading model not playing well with our workload
- JSON serialization overhead in responses & logging
- Complex proxy chain adding latency

**No single "aha moment"** - we all knew it was complicated

Notes:

We used Datadog's APM to trace requests end-to-end. When you're looking at this
kind of traffic volume, you need industrial-strength monitoring. The traces
showed us that the app server layer was the constraint. When we looked at the
uWSGI metrics, nothing seemed obviously wrong - which was the problem. We
couldn't get visibility into what was actually happening. JSON serialization
kept showing up in flamegraphs. And the more we looked at the architecture, the
more we realized we had complexity for complexity's sake - NGINX doing things
HAProxy could do, HAProxy doing things the app server could handle. No single
aha moment, but a lot of small realizations that added up.

---

## The Rust Tools

Three key integrations:

1. **Granian** - Rust-based ASGI/WSGI server
2. **orjson** - Fast JSON serialization
3. **jsonschema-rs** - High-performance JSON validation

Each solves a specific bottleneck with minimal integration effort

Notes:

We ended up using three main Rust components. Each solved a different problem.
Granian is the big one - replacing the entire nginx/HAProxy/uWSGI stack. orjson
and jsonschema-rs are smaller wins. But smaller wins compound. A 10% improvement
in JSON parsing plus a 10% improvement in validation plus a 2x improvement in
the app server doesn't just add - it multiplies through the system.

===

## orjson: Drop-in JSON Performance

**What it does:** Rust-based JSON serialization library

**Where we used it:**

- Django REST Framework responses
- python-json-logger integration
- Everywhere we called `json.dumps()` / `json.loads()`

**Integration effort:**

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

- ✅ Almost zero compatibility issues
- ⚠️ One customer noticed (they were manually parsing - fixed on their end)

Notes:

orjson was the easy win. Import, replace, done. We had to go through our
codebase manually - no LLMs were used, just grep and discipline. The rollout was
smooth. We did have one customer who had built custom parsing logic in bash and
they noticed the format was slightly different. But we were still sending valid
JSON - it was just faster. They were happy to stop doing their own parsing. This
is the kind of integration I'd recommend starting with if you're trying this.
Low risk, immediate benefit, easy to understand if something goes wrong.

===

## jsonschema-rs: Free Win

**Discovery:** We were running BOTH Python jsonschema AND jsonschema-rs

**Solution:** Drop the Python one entirely

**Impact:** Free performance win from removing duplicate work

**Lesson:** Sometimes the best optimization is removing code

Notes:

This is a funny story. We discovered we were actually running both the Python
jsonschema library AND jsonschema-rs - we had migrated some validation to
jsonschema-rs but never removed the Python dependency. It was just sitting there
doing nothing. We nuked it and got a free performance win. No code changes
needed, just dependency removal. The lesson here is that sometimes performance
optimization is about removing things, not adding them. Look for duplicate work,
dead code, unnecessary services.

---

## Load Testing: Finding the Right Tool

**We tried:**

1. **Locust** ❌ - Couldn't generate enough load
2. **wrk** ❌ - Same problem
3. **Goose** ✅ - Rust-based, could actually stress our system

**Key insight:** You need a load testing tool that can push harder than your
production traffic

Otherwise you're not finding real limits

Notes:

When we tried Locust and wrk, we hit ceiling effects. The load testing tool
would max out before the system under test did. That meant we weren't finding
real bottlenecks - we were finding load test tool limits. We switched to Goose,
which is Rust-based, and suddenly we could actually stress the system. The
lesson - especially for large scale systems - is that your load testing tool
needs to be at least as fast as what you're testing. Otherwise you're lying to
yourself about your system's limits.

---

## Granian: Simplifying the Stack

**What it is:** Rust HTTP server for Python apps (ASGI/WSGI) Built with Tokio
async runtime + Hyper HTTP

**What it replaced:** BEFORE: NGINX → HAProxy → uWSGI → Django AFTER: Granian →
Django

**Why Granian specifically:**

- Familiarity with Tokio/Hyper (easier to debug & contribute)
- Active development & responsive maintainer
- Modern architecture vs uWSGI's complexity

Notes:

Granian is the centerpiece of this whole project. It's a Rust HTTP server built
on top of Tokio, which is the de facto standard async runtime in Rust. I chose
it specifically because I was already familiar with Tokio and Hyper, which meant
if we hit issues, I could actually debug them. I could read the source code. I
could understand what was happening instead of treating it like a black box. And
that familiarity meant we could eventually contribute back observability
features that we needed. The architecture is modern - it handles the threading,
async, and connection management that took three separate components before.

===

## Load Test: uWSGI vs Granian (Staging)

| Metric                | uWSGI    | Granian  | Improvement |
| --------------------- | -------- | -------- | ----------- |
| **Throughput (RPS)**  | 18.38    | 24.20    | **+32%**    |
| **Avg Response Time** | 6,985ms  | 3,837ms  | **-45%**    |
| **P50 Latency**       | 7,000ms  | 3,000ms  | **-57%**    |
| **P95 Latency**       | 11,000ms | 12,000ms | +9%         |
| **Total Requests**    | 18,124   | 23,235   | +28%        |

**Test:** 0-200 concurrent users over 16 minutes (Goose v0.17.2)

uWSGI: Perfect reliability, lower throughput Granian: Higher throughput, faster
responses

Notes:

This was our first staging test comparing just the app servers. We ramped from 0
to 200 concurrent users over 16 minutes using Goose. The results were
compelling. 32% more throughput, 45% lower average latency, and 57% lower p50
latency - that middle 50% of requests were getting served faster. The p95 and
p99 went up slightly, but that's because we're pushing more traffic through the
system and handling tail cases better. Most importantly - uWSGI had zero errors.
It didn't crash. We're not talking about trading stability for performance.
We're talking about getting both.

===

## Load Test: Full Stack Comparison

| Metric                | NGINX/HAProxy/uWSGI | Granian | Improvement    |
| --------------------- | ------------------- | ------- | -------------- |
| **Throughput (RPS)**  | 70.89               | 144.39  | **+104% (2x)** |
| **Avg Response Time** | 1,799ms             | 841ms   | **-53%**       |
| **P50 Latency**       | 1,000ms             | 500ms   | **-50%**       |
| **P95 Latency**       | 5,000ms             | 3,000ms | **-40%**       |
| **P99 Latency**       | 7,000ms             | 4,000ms | **-43%**       |
| **Total Requests**    | 69,828              | 142,225 | +104%          |

✅ **2x throughput improvement** ✅ **Over 50% latency reduction**

Notes:

But that's not the full story. That first test was just comparing app servers.
Once we removed the nginx and HAProxy layer, the improvements multiplied. We
doubled throughput. Doubled. And we cut latency in half. That p50 improvement
means half of all requests are getting served twice as fast. The p95 improvement
means customers aren't waiting 5 seconds anymore - they're waiting 3. That adds
up across billions of requests. This is what happens when you remove unnecessary
complexity from your architecture.

---

## The Migration Journey

**Timeline:** Several months from testing → production

**Phased rollout:**

1. Extensive staging environment testing
2. Internal environment validation
3. Canary deployment by region
4. Gradual rollout over weeks

**Why so careful?** 110M requests/day = high-risk change

Notes:

We didn't go from "this looks good" to "deploy to everything" overnight. We had
months of testing. We set up a staging environment that mimicked production
traffic patterns as closely as we could. We ran it internally. We looked for
edge cases. Then we did a canary deployment in one region and watched carefully
for issues. If something went wrong with Granian in a canary region, it would
affect maybe 5% of our traffic. If something went wrong globally, we'd have
serious problems. The lesson here is that big infrastructure changes need time.
You can't test your way to 100% confidence, but you can reduce the blast radius
of your risk.

---

## What Broke (And How We Fixed It)

### **1. Database Connection Exhaustion** 💥

**Problem:** Django 4's "connection pooling" is just connection reuse Granian's
threading model = each thread spawns connections uWSGI green threads = better
connection sharing

**Solution:**

- Upgrade to Django 5.1's real connection pooling
- Adjust DB connection limits
- Still in progress (why Granian isn't at 100% yet)

Notes:

This was the big surprise. When we deployed Granian to production, we
immediately started seeing database connection exhaustion. We thought we had
connection pooling in Django, but what we actually had was connection reuse -
Django would hold onto a connection for a request and reuse it if the same
thread handled the next request. With uWSGI's green threading model, the same
thread would handle many requests. With Granian's true threading model, each
thread gets its own connection. So if Granian spawns 100 threads and each one
grabs a database connection, suddenly we're eating all our DB connection limits.
The fix is Django 5.1's real connection pooling, which separates the connection
lifecycle from the thread lifecycle. We're still rolling that out - this is why
Granian isn't at 100% in production yet. But this was a good learning. Threading
models matter. When you switch from green threads to OS threads, connection
management changes. You need to think about this.

===

## What Broke (And How We Fixed It)

### **2. HTTP Handling Differences**

**Problem:** NGINX was doing quirky HTTP normalization Hyper (Granian's HTTP
lib) follows spec strictly ALB started erroring in weird edge cases

**Solution:** Working through HTTP compatibility issues

Notes:

NGINX has been around forever and has all kinds of built-in assumptions about
how HTTP works. If you send it something slightly malformed, it fixes it. Hyper,
the HTTP library that Granian uses, is more strict - it follows the spec. So
we'd get valid Hyper responses that broke in weird ways at the AWS load
balancer. We're still working through these edge cases. It's tedious work but
necessary.

===

## What Broke (And How We Fixed It)

### **3. Development Workflow**

**Problem:** Can't attach Python debugger to Granian

**Workaround:** Fall back to uWSGI for local dev _Not ideal, but manageable_

Notes:

The debugger issue is real too. You can't attach pdb to a Granian process and
step through Python code. The workaround is falling back to uWSGI for local
development, which is fine. Most of the time when you're debugging, you're
debugging business logic in your application, not the app server itself. But if
you hit a weird app server issue, you're reaching for logging rather than a
debugger.

---

## Tuning Granian

**Key parameters we adjusted:**

```
granian --interface wsgi \
        --workers 8 \
        --threads 4 \           # blocking-threads
        --backlog 2048 \        # connection queue
        app:application
```

**Backlog:** Max connections to hold in queue **Threads:** Per-worker blocking
I/O threads **Workers:** Process count

**Goal:** Recreate HAProxy's backpressure behavior without HAProxy

Notes:

These configuration parameters are where the real tuning happens. The backlog is
particularly important. In the HAProxy architecture, if the app servers got
overwhelmed, HAProxy would queue requests. That queue created backpressure on
the load balancer, which would back off. With Granian, you need to set the
backlog explicitly - that's the max number of connections Granian will hold in
the kernel listen queue while waiting for app server threads to become
available. If this is too low, you drop connections. If it's too high, you're
lying to the load balancer about how much capacity you have. We tuned this to
2048 to match the behavior we had with HAProxy. The threads parameter controls
how many threads per worker can handle blocking I/O - things like database
queries or external API calls. Workers is how many processes you spawn. Finding
the right balance took experimentation and load testing.

---

## Contributing Back to Granian

**What we needed:** Production observability

**What was missing:**

- Backlog queue metrics
- Tokio event loop visibility
- Prometheus-compatible metrics export

**What we did:**

- Forked Granian & added Prometheus metrics
- Exposed backlog depth, event loop stats
- Working with maintainer Giovanni Barillari to upstream

**Current status:** Implementation works but makes Linux assumptions Refining
for cross-platform merge

Notes:

When we deployed Granian to production, we realized we didn't have visibility
into what it was doing. Is the backlog building up? Is the event loop saturated?
Is there a bottleneck in the runtime? We needed metrics. So we forked Granian,
added Prometheus metrics, and exposed what we needed. The backlog depth is
particularly important - it tells you if you're hitting the limits of your
tuning. Too high and you're queueing requests too long. We started working with
Giovanni, the Granian maintainer, to get these features upstream. The
implementation works but makes some Linux-specific assumptions about how to get
metrics from the kernel. We're refining it to be cross-platform so it can be
merged back. Why do this? Because we depend on Granian in production and we want
the improvements to benefit everyone else using it.

---

## Why This Matters

**For us:**

- ✅ Production-grade monitoring
- ✅ Long-term support from community
- ✅ Don't maintain a permanent fork

**For the ecosystem:**

- ✅ Everyone benefits from observability
- ✅ Granian becomes more production-ready
- ✅ Rust-Python integration gets better

**Lesson:** If you depend on it in production, help make it better

Notes:

Contributing back isn't altruism - though that's nice. It's pragmatism. If we
maintain a private fork with features no one else has, we're locked in. We're
responsible for merging every upstream release into our fork. We're stuck. By
working with Giovanni to upstream our changes, we get the features in the
mainline, other people benefit, and Granian gets better for everyone. This
benefits us in the long run.

---

## Where We Are Today

**Granian deployment:**

- ✅ Running in production (canary regions)
- ⏳ Not at 100% yet (Django upgrade in progress)
- ✅ Debugging is MUCH easier than uWSGI
- ✅ Performance gains confirmed in production

**Rust in our stack:**

- orjson: ✅ Fully rolled out
- jsonschema-rs: ✅ Fully rolled out
- Granian: ⏳ Phased rollout ongoing

**Next step:** Full Granian rollout after Django 5.1 migration

Notes:

We're in production with Granian in canary regions right now. Performance gains
are confirmed - we're seeing the 2x throughput improvement translate to
production. We're not at 100% yet because we're still upgrading Django to get
real connection pooling in place. That's the blocker. But the fact that we're
not at 100% doesn't mean we failed - it means we're being careful. We're
validating edge cases. We're not pushing a change that would break the database
layer. orjson and jsonschema-rs are fully rolled out everywhere. They work,
they're stable, they're not causing issues. The next milestone is finishing the
Django upgrade and rolling Granian out to 100% of our traffic.

---

## Unexpected Benefit: Confidence

**Rust libs for Python are very stable**

This experience gave us confidence to:

- ✅ Experiment with more Rust libraries
- ✅ Build new services in pure Rust
- ✅ Always consider Rust tools first

**Every rollout:** Small improvements add up

**Cultural shift:** Team now comfortable with Rust in the stack

Notes:

Something unexpected happened. After we successfully rolled out three Rust
libraries and had positive experiences, the team's attitude shifted. We went
from "Rust? That's scary, that's for systems programming" to "hey, should we be
considering Rust for this?" Now when we're evaluating tools, Rust
implementations are in the consideration set. We've started building new
services in pure Rust because we know we can integrate them, we know they're
stable, and we know the performance benefits are real. That cultural shift is
worth mentioning. It's not just about the performance numbers - it's about
having the confidence to use the right tool for the job.

---

## When This Approach Works

**Good fit when you have:**

- ✅ Identifiable performance bottlenecks
- ✅ Existing Python codebase with business logic
- ✅ SRE/Ops expertise for integration work
- ✅ Time for thorough testing (months, not days)
- ✅ Mature Rust alternatives exist

**Not a good fit when:**

- ❌ Already optimized & hitting theoretical limits
- ❌ Pure I/O bound (Python async is fine)
- ❌ Team unfamiliar with systems programming
- ❌ Full rewrite is actually viable

Notes:

This strategy isn't a silver bullet. It works when you have a clear bottleneck
and a mature Rust tool that solves it. If your system is already well-optimized,
this won't help much. If your bottleneck is I/O - and you don't have connection
pooling issues like we did - Python's async capabilities might be enough. If
your team is uncomfortable with Rust or systems programming concepts, the
maintenance burden could be high. And if you're at a stage where a full rewrite
actually is viable - you have time, you have resources, you're willing to accept
the risk - then maybe Rust end-to-end is the right call. But if you're like most
teams - constrained on time, resources, risk tolerance - this incremental
approach works well.

---

## Key Takeaways

1. **Measure first** - Datadog traces revealed the truth
2. **Load test properly** - Your tool must stress harder than production
3. **Start small** - orjson was easy, Granian took months
4. **Test extensively** - We found DB pooling issues in staging

===

## Key Takeaways (continued)

5. **Phased rollouts** - Canary saved us from breaking 110M req/day
6. **Contribute back** - Production needs justify upstream work
7. **Threading models matter** - Granian != uWSGI (learn the differences)
8. **Simplicity wins** - Removing HAProxy/NGINX reduced complexity

Notes:

If you take nothing else from this talk, remember these eight things. Measure,
test, start small, test more, roll out carefully, give back to the community,
understand what you're changing, and simplify. These principles apply whether
you're using Rust tools or any other infrastructure change.

---

## If You Want To Try This

**Step 1:** Profile your app (py-spy, Datadog APM, whatever)

**Step 2:** Find the bottleneck (app server? JSON? validation?)

**Step 3:** Check if a Rust tool exists (probably does)

===

## If You Want To Try This (continued)

**Step 4:** Start with the easiest integration (orjson = 1 hour)

**Step 5:** Load test with Goose before & after

**Step 6:** If it works, test harder things (Granian)

===

## The Golden Rule

**Don't:** Rewrite everything in Rust

**Do:** Use Rust where it gives you 2x wins for minimal effort

Notes:

If you're sitting here thinking "okay, this sounds good, but how do I start?"
Here's the playbook. First, you need data. Profile your application. Find where
the time is going. Then ask - is there a Rust tool that solves this? The answer
is often yes. Start with something low-risk. orjson is about as low-risk as it
gets - it's a drop-in replacement for json. If that works, iterate to harder
problems. Load test everything before and after. Don't fall into the trap of
rewriting your whole system in Rust to fix a JSON serialization issue. Find the
specific bottleneck, find the specific tool, integrate it, measure the
improvement, move on.

---

## What's Next for Us

**Short term:**

- ✅ Complete Django 5.1 upgrade (connection pooling)
- ✅ Finish Granian rollout to 100%
- ✅ Upstream Prometheus metrics to Granian

**Long term:**

- Explore more Rust-Python libraries
- Build new services in pure Rust (when appropriate)
- Continue simplifying infrastructure

**Philosophy:** Hybrid is pragmatic - use the right tool for each layer

Notes:

We're not done. The next phase is finishing the Django upgrade and getting
Granian to 100%. We're working with Giovanni to get our observability features
upstream. And longer term, we're going to keep evaluating tools through this
lens. When we need to build something new, we'll consider whether Rust is the
right choice. The key insight here is pragmatism. We're not religious about
this. We're not saying "everything should be Rust." We're saying "use the right
tool for each specific problem." For API responses, orjson. For request
handling, Granian. For connection pooling, we're using Django's native support.
It's a hybrid approach and that's okay.

---

## Thank You!

**Questions?**

**Cian Butler** Senior SRE @ Cloudsmith 📧 cbutler@cloudsmith.io

_We're building the future of supply chain security_ _Cloudsmith is hiring:
cloudsmith.com/careers_

---

**tl;dr:** We got 2x throughput on an 8-year-old Django monolith by swapping in
Rust tools without rewriting anything.

Notes:

Thank you for your time. We went from a complicated multi-component architecture
to a simpler one with 2x the throughput and half the latency. No rewrite, no
panic, just strategic integration of the right tools. If you have questions
about how we did this, how you can do it with your own systems, or about
Cloudsmith and what we're building, come talk to me after. I'm happy to discuss
any of this in detail.
