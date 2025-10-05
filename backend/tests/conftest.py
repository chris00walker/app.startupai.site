"""
PyTest Configuration

Shared fixtures and configuration for all tests.
"""

import sys
from pathlib import Path

# Add backend/src to Python path
backend_src = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(backend_src))
