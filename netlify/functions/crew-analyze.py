#!/usr/bin/env python3
"""
Netlify Function for StartupAI CrewAI Backend

Supports three actions:
1. `conversation_start` - seeds onboarding session context and persona.
2. `conversation_message` - processes a conversation turn and returns quality signals.
3. Default `analysis` - runs the CrewAI workflow and returns structured deliverables.
"""

# @story US-CP09

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Tuple

# Import runtime engines (these work standalone without backend dependencies)
try:
    from crew_runtime import ConversationEngine, CrewAnalysisEngine  # type: ignore
    # Import StartupAICrew availability status for health checks
    import crew_runtime
    StartupAICrew = crew_runtime.StartupAICrew
    print(f"[CREW-ANALYZE] Successfully imported crew_runtime and StartupAICrew")
except ImportError as import_error:
    # Log detailed error for debugging
    print(f"[IMPORT ERROR] Failed to import crew_runtime: {import_error}")
    print(f"[IMPORT ERROR] Python path: {sys.path}")
    print(f"[IMPORT ERROR] Current directory: {Path(__file__).parent}")
    raise

# ============================================================================
# Rate Limiting (in-memory; resets per cold start)
# ============================================================================

ANALYSIS_RATE_LIMIT = 10
ANALYSIS_WINDOW = timedelta(minutes=15)
CONVERSATION_RATE_LIMIT = 60
CONVERSATION_WINDOW = timedelta(minutes=5)
START_RATE_LIMIT = 6
START_WINDOW = timedelta(minutes=15)

rate_limit_store: Dict[str, Dict[str, Any]] = {}


def check_rate_limit(user_id: str, bucket: str, *, limit: int, window: timedelta) -> Tuple[bool, int]:
    """Basic in-memory rate limiter keyed by user + action bucket."""
    key = f"{user_id}:{bucket}"
    now = datetime.utcnow()
    bucket_entry = rate_limit_store.setdefault(key, {"timestamps": []})

    bucket_entry["timestamps"] = [ts for ts in bucket_entry["timestamps"] if now - ts < window]
    if len(bucket_entry["timestamps"]) >= limit:
        return False, 0

    bucket_entry["timestamps"].append(now)
    remaining = max(limit - len(bucket_entry["timestamps"]), 0)
    return True, remaining


# ============================================================================
# Utilities
# ============================================================================

conversation_engine = ConversationEngine()
analysis_engine = CrewAnalysisEngine()


def log_request(
    event: Dict[str, Any],
    *,
    user_id: str | None = None,
    status: str = "received",
    action: str = "analysis",
) -> None:
    timestamp = datetime.utcnow().isoformat()
    log_data = {
        "timestamp": timestamp,
        "status": status,
        "action": action,
        "method": event.get("httpMethod"),
        "path": event.get("path"),
        "user_id": user_id,
        "ip": event.get("headers", {}).get("x-forwarded-for", "unknown"),
    }
    print(f"[{timestamp}] REQUEST {status.upper()}: {json.dumps(log_data)}")


def json_response(status_code: int, body: Dict[str, Any], *, headers: Dict[str, str] | None = None) -> Dict[str, Any]:
    base_headers = {"Content-Type": "application/json"}
    if headers:
        base_headers.update(headers)
    return {
        "statusCode": status_code,
        "headers": base_headers,
        "body": json.dumps(body),
    }


def authenticate_request(token: str) -> Tuple[str, str]:
    """Validate Supabase JWT and return (user_id, user_email)."""
    try:
        from supabase import Client, create_client
    except ImportError as import_err:
        print(f"[AUTH ERROR] Failed to import supabase: {import_err}")
        raise RuntimeError("Supabase client not available - check requirements.txt")

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")

    if not supabase_url:
        print("[AUTH ERROR] SUPABASE_URL environment variable not set")
        raise RuntimeError("Supabase URL not configured")
    if not supabase_key:
        print("[AUTH ERROR] SUPABASE_ANON_KEY environment variable not set")
        raise RuntimeError("Supabase key not configured")

    try:
        client: Client = create_client(supabase_url, supabase_key)
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise PermissionError("Invalid or expired token")

        return user_response.user.id, user_response.user.email  # type: ignore[attr-defined]
    except Exception as auth_err:
        print(f"[AUTH ERROR] Supabase authentication failed: {auth_err}")
        raise


def handle_conversation_start(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Handle conversation_start action - seeds onboarding session context."""
    plan_type = (body.get("plan_type") or "trial").lower()
    user_context = body.get("user_context") or {}

    print(f"[CONVERSATION_START] Starting session for user={user_id}, plan={plan_type}")

    try:
        seed = conversation_engine.start_session(plan_type=plan_type, user_context=user_context)
        print(f"[CONVERSATION_START] Session created successfully for user={user_id}")

        return {
            "success": True,
            "kind": "conversation_start",
            "session": {
                "agent_introduction": seed["introduction"],
                "first_question": seed["first_question"],
                "context": seed["context"],
                "stage_state": seed["stage_state"],
                "stage_snapshot": seed["stage_snapshot"],
                "quality_signals": seed["quality_signals"],
                "estimated_duration": seed["estimated_duration"],
                "user_context": seed["user_context"],
            },
        }
    except Exception as conv_err:
        print(f"[CONVERSATION_START ERROR] Failed to start session: {conv_err}")
        import traceback
        traceback.print_exc()
        raise


def handle_conversation_message(body: Dict[str, Any], user_id: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
    required_fields = ["session_id", "message", "current_stage"]
    missing = [field for field in required_fields if not body.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    session_id = body["session_id"]
    message = body["message"]
    current_stage = int(body.get("current_stage", 1))
    history = body.get("conversation_history") or []
    stage_data = body.get("stage_data") or {}

    result = conversation_engine.process_message(
        session_id=session_id,
        message=message,
        current_stage=current_stage,
        conversation_history=history,
        stage_data=stage_data,
    )

    response_payload = {
        "success": True,
        "kind": "conversation_message",
        "message": {
            "agent_response": result["agent_response"],
            "follow_up_question": result["follow_up_question"],
            "quality_signals": result["quality_signals"],
            "brief_update": result["brief_update"],
            "stage_state": result["stage_state"],
            "stage_snapshot": result["stage_snapshot"],
            "system_actions": result["system_actions"],
            "conversation_metrics": result["conversation_metrics"],
        },
    }

    headers = {
        "X-Conversation-Stage": str(result["stage_state"]["current_stage"]),
        "X-Conversation-Progress": str(result["conversation_metrics"]["overall_progress"]),
    }
    return response_payload, headers


def handle_analysis(body: Dict[str, Any], user_id: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
    required_fields = ["strategic_question", "project_id"]
    missing = [field for field in required_fields if not body.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    inputs = {
        "strategic_question": body["strategic_question"],
        "project_id": body["project_id"],
        "project_context": body.get("project_context", ""),
        "target_sources": body.get("target_sources", ""),
        "report_format": body.get("report_format", "markdown"),
        "project_deadline": body.get("project_deadline", ""),
        "priority_level": body.get("priority_level", "medium"),
        "session_id": body.get("session_id"),
    }

    analysis_id, structured_payload, engine_metadata = analysis_engine.run_analysis(inputs=inputs, user_id=user_id)
    metadata = {
        "project_id": inputs["project_id"],
        "question": inputs["strategic_question"],
        "user_id": user_id,
        "engine": engine_metadata,
    }

    response_payload = {
        "success": True,
        "analysis_id": analysis_id,
        "result": structured_payload,
        "metadata": metadata,
    }
    headers = {"X-Analysis-Mode": engine_metadata.get("mode", "fallback")}
    return response_payload, headers


# ============================================================================
# Netlify Handler
# ============================================================================

def handler(event, context):  # noqa: D401, pylint: disable=unused-argument
    """Entry point invoked by Netlify for both foreground and local testing."""
    request_start = datetime.utcnow()

    # Health check endpoint
    if event.get("httpMethod") == "GET":
        return json_response(200, {
            "status": "healthy",
            "service": "crew-analyze",
            "timestamp": datetime.utcnow().isoformat(),
            "capabilities": {
                "conversation_start": True,
                "conversation_message": True,
                "analysis": StartupAICrew is not None,
            },
            "environment": {
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "has_supabase_config": bool(os.environ.get("SUPABASE_URL")),
                "startup_ai_crew_available": StartupAICrew is not None,
            },
        })

    log_request(event, status="received")

    if event.get("httpMethod") != "POST":
        log_request(event, status="method_not_allowed")
        return json_response(405, {"error": "Method not allowed. Use POST or GET for health check."})

    if not event.get("body"):
        return json_response(400, {"error": "Request body is required"})

    try:
        body = json.loads(event["body"])
    except json.JSONDecodeError:
        return json_response(400, {"error": "Invalid JSON in request body"})

    action = body.get("action", "analysis")
    if action not in {"analysis", "conversation_start", "conversation_message"}:
        return json_response(400, {"error": f"Unsupported action '{action}'"})

    auth_header = event.get("headers", {}).get("authorization", "")
    if not auth_header:
        return json_response(401, {"error": "Authentication required. Provide Bearer token."})

    token = auth_header.split(" ")[1] if " " in auth_header else auth_header

    try:
        user_id, user_email = authenticate_request(token)
    except PermissionError as auth_error:
        log_request(event, status="auth_failed", action=action)
        return json_response(401, {"error": "Authentication failed", "details": str(auth_error)})
    except Exception as exc:  # pragma: no cover - defensive path
        log_request(event, status="auth_failed", action=action)
        return json_response(500, {"error": "Server configuration error", "details": str(exc)})

    log_request(event, user_id=user_id, status="authenticated", action=action)

    try:
        if action == "conversation_start":
            allowed, remaining = check_rate_limit(
                user_id,
                "conversation_start",
                limit=START_RATE_LIMIT,
                window=START_WINDOW,
            )
            if not allowed:
                return json_response(
                    429,
                    {
                        "error": "Too many session starts. Please try again soon.",
                        "retry_after_seconds": int(START_WINDOW.total_seconds()),
                    },
                )

            payload = handle_conversation_start(body, user_id)
            headers = {
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Limit": str(START_RATE_LIMIT),
            }
            return json_response(200, payload, headers=headers)

        if action == "conversation_message":
            allowed, remaining = check_rate_limit(
                user_id,
                "conversation_message",
                limit=CONVERSATION_RATE_LIMIT,
                window=CONVERSATION_WINDOW,
            )
            if not allowed:
                return json_response(
                    429,
                    {
                        "error": "Conversation rate limit reached. Pause briefly before sending another message.",
                        "retry_after_seconds": int(CONVERSATION_WINDOW.total_seconds()),
                    },
                )

            payload, extra_headers = handle_conversation_message(body, user_id)
            headers = {
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Limit": str(CONVERSATION_RATE_LIMIT),
                **extra_headers,
            }
            return json_response(200, payload, headers=headers)

        # analysis (default action)
        allowed, remaining = check_rate_limit(
            user_id,
            "analysis",
            limit=ANALYSIS_RATE_LIMIT,
            window=ANALYSIS_WINDOW,
        )
        if not allowed:
            return json_response(
                429,
                {
                    "error": "Rate limit exceeded. Please wait before running another analysis.",
                    "retry_after_seconds": int(ANALYSIS_WINDOW.total_seconds()),
                },
            )

        payload, extra_headers = handle_analysis(body, user_id)
        execution_time = (datetime.utcnow() - request_start).total_seconds()
        payload.setdefault("metadata", {}).update(
            {
                "execution_time_seconds": round(execution_time, 2),
                "rate_limit": {
                    "limit": ANALYSIS_RATE_LIMIT,
                    "remaining": remaining,
                    "window_seconds": int(ANALYSIS_WINDOW.total_seconds()),
                },
            }
        )

        headers = {
            "X-RateLimit-Limit": str(ANALYSIS_RATE_LIMIT),
            "X-RateLimit-Remaining": str(remaining),
            "X-Execution-Time": str(execution_time),
            **extra_headers,
        }
        log_request(event, user_id=user_id, status="completed", action=action)
        return json_response(200, payload, headers=headers)

    except ValueError as validation_error:
        log_request(event, user_id=user_id, status="invalid", action=action)
        return json_response(400, {"error": str(validation_error)})
    except Exception as exc:  # pragma: no cover - defensive path
        execution_time = (datetime.utcnow() - request_start).total_seconds()
        log_request(event, user_id=user_id, status="error", action=action)
        error_payload = {
            "error": "Internal server error",
            "details": str(exc),
            "execution_time": execution_time,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return json_response(500, error_payload)


if __name__ == "__main__":  # pragma: no cover
    test_event = {
        "httpMethod": "POST",
        "headers": {"authorization": "Bearer test-token"},
        "body": json.dumps(
            {
                "action": "analysis",
                "strategic_question": "What are the key trends in AI strategic planning?",
                "project_id": "test-project-123",
                "project_context": "B2B SaaS startup",
                "priority_level": "high",
            }
        ),
    }
    print(json.dumps(handler(test_event, {}), indent=2))
