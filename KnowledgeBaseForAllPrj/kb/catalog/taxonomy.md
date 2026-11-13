---
id: kb.catalog.taxonomy
title: Knowledge taxonomy
summary: Phân loại tri thức, scope và quan hệ dùng trong universal KB.
kind: catalog
scope: shared
status: approved
owners: [kb-maintainers]
tags: [taxonomy, metadata]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-12
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [w3c-prov]
relations: [defines:kb.standard.knowledge-contract]
---

# Knowledge taxonomy

## Kinds

| Kind | Mục đích | Ví dụ |
|---|---|---|
| `catalog` | Điều hướng và taxonomy | home, glossary |
| `principle` | Quy tắc ổn định, ít thay đổi | source-of-truth |
| `pattern` | Giải pháp có điều kiện và trade-off | retrieval, orchestration |
| `standard` | Contract bắt buộc | metadata, security, eval |
| `runbook` | Quy trình vận hành | freshness audit |
| `overview` | Bối cảnh và boundary dự án | project overview |
| `architecture` | Component, data flow, deployment | system context |
| `requirement` | Hành vi và acceptance | functional/NFR |
| `interface` | API/event/schema contract | OpenAPI, event contract |
| `decision` | ADR và lý do | choose PostgreSQL |
| `change` | Change request và delivery state | CR-2026-004 |
| `lesson` | Postmortem hoặc reusable insight | incident lesson |

## Status

`draft → proposed → approved → deprecated → superseded`. Chỉ `approved` là canonical mặc định. `deprecated` vẫn đúng trong bối cảnh cũ nhưng không dùng cho thiết kế mới; `superseded` phải trỏ tới phiên bản thay thế.

## Typed relations

Quan hệ chuẩn: `depends-on`, `implements`, `constrains`, `validates`, `derived-from`, `had-primary-source`, `supersedes`, `superseded-by`, `related-to`, `owns`, `defines`. Dùng stable ID làm target.

## Scope

`shared` là mặc định xuyên dự án. Project scope override shared pattern chỉ khi trang project nêu rõ khác biệt và quan hệ tới trang bị override. Sensitivity không được hạ thấp khi derive/chunk/index.
