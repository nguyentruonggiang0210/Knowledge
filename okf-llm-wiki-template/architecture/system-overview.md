---
type: Architecture
title: System Overview
description: High-level architecture and major runtime boundaries.
tags: [architecture, overview]
status: active
generated:
  by: human:maintainer
  at: 2026-09-07T00:00:00Z
---

# System Overview

## Purpose

Describe the system's major components and their responsibilities.

## Context

```text
Client
  |
  v
API Gateway
  |
  +--> Application Service
  |       |
  |       +--> Database
  |       +--> Cache
  |       +--> Message Broker
  |
  +--> External Services
```

## Components

- [Application Service](../services/application-service.md)
- [Database](../data/database.md)

## Key Constraints

- <constraint>

## Source of Truth

- Architecture diagrams and deployment manifests should be treated as implementation evidence.
