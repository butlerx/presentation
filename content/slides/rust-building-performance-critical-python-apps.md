---
title: Building performance-critical Python tools with Rust: Lessons from production
description: |-
 Python dominates web development, but they often comes with performance and
 scaling issues. Recently, the Python ecosystem has seen massive performance gains
 from projects written in Rust, such as uv and ruff. But what other projects
 are out there to help Python scale thanks to Rust? At Cloudsmith, we achieved 2x
 throughput on our 8-year-old Django monolith by integrating Rust-based tools and
 contributed features back upstream

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

     https://github.com/emmett-framework/granian
     https://pyo3.rs/
     https://github.com/ijl/orjson
author: Cian Butler <cbutler@cloudsmith.io>
date: 2025-02-01T13:00:00Z
slideOptions:
  theme: cloudsmith
---
