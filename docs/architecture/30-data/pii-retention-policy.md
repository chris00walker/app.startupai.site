---
title: PII Retention Policy
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Scope

- Applies to any personal data collected during engagements.

## Principles

- PII minimization by default.
- AES-256 column encryption for any PII fields.
- Access via least-privilege IAM; all access logged.

## Retention

- Raw PII: 30 days, then delete or anonymize.
- Aggregated metrics: retained for analytics, non-identifiable.

## Subject Requests

- Support export and delete within 30 days.
