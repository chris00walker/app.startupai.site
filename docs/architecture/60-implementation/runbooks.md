---
title: Runbooks — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Incident: Latency Spike

- Check Cloud Monitoring dashboards
- Inspect queue depth; scale renderer/orchestrator
- Review recent deployments; rollback if needed

## Incident: Cost Overrun

- Check policy DSL budgets and breakers
- Downgrade model tier for Standard tasks

## Incident: Render Failures

- Check Chromium flags and logs
- Requeue failed jobs
