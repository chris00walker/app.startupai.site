#!/usr/bin/env python3
"""Test script for crew-analyze function (conversation_start action)"""

import json
import os
import sys

# Set minimal environment for testing
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-key-12345")

# Add netlify functions to path
sys.path.insert(0, "/home/user/app.startupai.site/netlify/functions")

# Import the handler (need to use importlib for files with hyphens)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "crew_analyze",
    "/home/user/app.startupai.site/netlify/functions/crew-analyze.py"
)
crew_analyze = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crew_analyze)
handler = crew_analyze.handler


def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    event = {
        "httpMethod": "GET",
        "headers": {},
    }

    response = handler(event, {})
    print(f"Status: {response['statusCode']}")
    body = json.loads(response['body'])
    print(f"Response: {json.dumps(body, indent=2)}")

    assert response['statusCode'] == 200
    assert body['status'] == 'healthy'
    assert body['capabilities']['conversation_start'] is True
    print("✓ Health check passed")


def test_conversation_start_no_auth():
    """Test conversation_start without authentication (should fail)"""
    print("\n=== Testing conversation_start without auth ===")
    event = {
        "httpMethod": "POST",
        "headers": {},
        "body": json.dumps({
            "action": "conversation_start",
            "plan_type": "trial",
        }),
    }

    response = handler(event, {})
    print(f"Status: {response['statusCode']}")
    body = json.loads(response['body'])
    print(f"Response: {json.dumps(body, indent=2)}")

    assert response['statusCode'] == 401
    assert 'error' in body
    print("✓ Correctly rejected unauthenticated request")


def test_conversation_start_mock_structure():
    """Test that ConversationEngine produces correct structure"""
    print("\n=== Testing ConversationEngine structure ===")

    from crew_runtime import ConversationEngine

    engine = ConversationEngine()
    result = engine.start_session(plan_type="sprint", user_context={"test": "data"})

    # Verify all required fields
    required_fields = [
        'introduction',
        'first_question',
        'context',
        'stage_state',
        'stage_snapshot',
        'quality_signals',
        'estimated_duration',
        'user_context',
    ]

    for field in required_fields:
        assert field in result, f"Missing field: {field}"

    # Verify nested structures
    assert 'current_stage' in result['stage_state']
    assert 'total_stages' in result['stage_state']
    assert result['stage_state']['current_stage'] == 1
    assert result['stage_state']['total_stages'] == 7

    assert 'clarity' in result['quality_signals']
    assert 'completeness' in result['quality_signals']

    print(f"✓ ConversationEngine structure is correct")
    print(f"  - Introduction: {result['introduction'][:80]}...")
    print(f"  - First question: {result['first_question'][:80]}...")
    print(f"  - Current stage: {result['stage_state']['current_stage']}/{result['stage_state']['total_stages']}")


if __name__ == "__main__":
    try:
        test_health_check()
        test_conversation_start_no_auth()
        test_conversation_start_mock_structure()

        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        print("\nThe crew-analyze function is ready for deployment.")
        print("\nNext steps:")
        print("1. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Netlify")
        print("2. Deploy to Netlify")
        print("3. Test the health endpoint: GET /.netlify/functions/crew-analyze")
        print("4. Test the onboarding flow end-to-end")

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
