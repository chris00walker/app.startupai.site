#!/usr/bin/env python3
"""
Diagnostic endpoint for troubleshooting crew-analyze deployment issues.
"""

# @story US-A05

import json
import os
import sys
from pathlib import Path


def handler(event, context):
    """Diagnostic handler to check environment and imports."""
    diagnostics = {
        "status": "running",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "python_path": sys.path,
        "current_directory": str(Path(__file__).parent),
        "current_file": str(Path(__file__)),
        "environment_variables": {
            "SUPABASE_URL": "set" if os.environ.get("SUPABASE_URL") else "NOT SET",
            "SUPABASE_ANON_KEY": "set" if os.environ.get("SUPABASE_ANON_KEY") else "NOT SET",
            "OPENAI_API_KEY": "set" if os.environ.get("OPENAI_API_KEY") else "NOT SET",
        },
        "files_in_directory": [],
        "import_tests": {},
    }

    # List files in the functions directory
    try:
        functions_dir = Path(__file__).parent
        diagnostics["files_in_directory"] = [
            str(f.name) for f in functions_dir.iterdir() if f.is_file()
        ]
    except Exception as e:
        diagnostics["files_error"] = str(e)

    # Test imports
    try:
        import crew_runtime
        diagnostics["import_tests"]["crew_runtime"] = "SUCCESS"
        diagnostics["import_tests"]["crew_runtime_location"] = str(crew_runtime.__file__)
    except ImportError as e:
        diagnostics["import_tests"]["crew_runtime"] = f"FAILED: {e}"
    except Exception as e:
        diagnostics["import_tests"]["crew_runtime"] = f"ERROR: {e}"

    try:
        from crew_runtime import ConversationEngine
        diagnostics["import_tests"]["ConversationEngine"] = "SUCCESS"
    except ImportError as e:
        diagnostics["import_tests"]["ConversationEngine"] = f"FAILED: {e}"
    except Exception as e:
        diagnostics["import_tests"]["ConversationEngine"] = f"ERROR: {e}"

    try:
        from supabase import create_client
        diagnostics["import_tests"]["supabase"] = "SUCCESS"
    except ImportError as e:
        diagnostics["import_tests"]["supabase"] = f"FAILED: {e}"
    except Exception as e:
        diagnostics["import_tests"]["supabase"] = f"ERROR: {e}"

    try:
        import dotenv
        diagnostics["import_tests"]["dotenv"] = "SUCCESS"
    except ImportError as e:
        diagnostics["import_tests"]["dotenv"] = f"FAILED: {e}"
    except Exception as e:
        diagnostics["import_tests"]["dotenv"] = f"ERROR: {e}"

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(diagnostics, indent=2),
    }
