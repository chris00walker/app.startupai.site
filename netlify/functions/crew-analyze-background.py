#!/usr/bin/env python3
"""
Netlify Background Function for StartupAI CrewAI Backend.

This variant mirrors the foreground `crew-analyze` function but is designed for
long-running analyses (up to 15 minutes). It validates Supabase authentication
when provided, executes the Crew workflow via `CrewAnalysisEngine`, and logs the
structured payload so downstream systems (Supabase, Netlify Blobs, etc.) can
persist the results.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Tuple

# Ensure backend modules are importable before loading helpers
backend_src = Path(__file__).parent.parent.parent / "backend" / "src"
backend_src_str = str(backend_src)
if backend_src_str not in sys.path:
    sys.path.insert(0, backend_src_str)

from crew_runtime import CrewAnalysisEngine  # type: ignore

analysis_engine = CrewAnalysisEngine()


def authenticate_request(token: str) -> Tuple[str, str]:
    """Validate Supabase JWT and return (user_id, user_email)."""
    from supabase import Client, create_client

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Supabase credentials not configured")

    client: Client = create_client(supabase_url, supabase_key)
    user_response = client.auth.get_user(token)
    if not user_response or not user_response.user:
        raise PermissionError("Invalid or expired token")

    return user_response.user.id, user_response.user.email  # type: ignore[attr-defined]


def handler(event, context):  # noqa: D401, pylint: disable=unused-argument
    """Entry point invoked by Netlify for background execution."""
    start_time = datetime.utcnow()
    print(f"[{start_time.isoformat()}] Background analysis started")

    try:
        body = json.loads(event.get("body") or "{}")
        project_id = body.get("project_id")
        strategic_question = body.get("strategic_question")

        if not project_id or not strategic_question:
            raise ValueError("project_id and strategic_question are required for background analysis")

        user_id = "system-background"
        auth_header = event.get("headers", {}).get("authorization", "")
        if auth_header:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            try:
                user_id, user_email = authenticate_request(token)
                print(f"Authenticated background request for user {user_email} ({user_id})")
            except Exception as exc:  # pragma: no cover - defensive path
                print(f"Background auth warning: {exc}. Continuing with system scope.")
        else:
            print("Background function invoked without authorization header; using system scope.")

        inputs = {
            "strategic_question": strategic_question,
            "project_id": project_id,
            "project_context": body.get("project_context", ""),
            "target_sources": body.get("target_sources", ""),
            "report_format": body.get("report_format", "markdown"),
            "project_deadline": body.get("project_deadline", ""),
            "priority_level": body.get("priority_level", "medium"),
            "session_id": body.get("session_id"),
        }

        analysis_id, structured_payload, metadata = analysis_engine.run_analysis(inputs=inputs, user_id=user_id)
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        # TODO: Persist to Supabase or Netlify Blobs. For now, we log the summary.
        print(f"[{datetime.utcnow().isoformat()}] Background analysis complete for project: {project_id}")
        print(f"Analysis ID: {analysis_id}")
        print(f"Execution mode: {metadata.get('mode')} ({metadata.get('error', 'no errors')})")
        print(f"Execution time: {execution_time:.2f}s")
        print("Summary preview:", structured_payload.get("summary", "")[:240])
        print("Insight headlines:", [insight["headline"] for insight in structured_payload.get("insight_summaries", [])])

    except Exception as exc:  # pragma: no cover - defensive path
        print(f"ERROR in background function: {type(exc).__name__}: {exc}")

    # Background functions automatically return 202 with an empty body.
    print("Background function execution finished")


if __name__ == "__main__":  # pragma: no cover
    test_event = {
        "httpMethod": "POST",
        "body": json.dumps(
            {
                "strategic_question": "What are the key trends in AI strategic planning?",
                "project_id": "test-background-123",
                "project_context": "Background processing test",
            }
        ),
    }
    handler(test_event, {})
