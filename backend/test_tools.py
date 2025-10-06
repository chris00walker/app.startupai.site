#!/usr/bin/env python3
"""
Test script for StartupAI CrewAI tools
"""

import os
import sys
import json
from datetime import datetime

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from startupai.tools import EvidenceStoreTool, VectorSearchTool, WebSearchTool, ReportGeneratorTool

def test_evidence_store():
    """Test Evidence Store Tool"""
    print("🧪 Testing Evidence Store Tool...")
    
    tool = EvidenceStoreTool()
    
    # Test create evidence
    test_evidence = {
        "title": "Test Evidence Item",
        "content": "This is a test evidence item for validation",
        "source": "Test Source",
        "strength": "strong",
        "source_type": "research",
        "category": "desirability",
        "summary": "Test summary",
        "author": "Test Agent"
    }
    
    result = tool._run(
        action="create",
        project_id="test-project-123",
        evidence_data=test_evidence
    )
    
    print(f"Create result: {result}")
    
    # Parse result to get evidence_id for further tests
    try:
        result_data = json.loads(result)
        if result_data.get("status") == "success":
            print("✅ Evidence Store Tool - CREATE: PASSED")
            return result_data.get("evidence_id")
        else:
            print("❌ Evidence Store Tool - CREATE: FAILED")
            return None
    except Exception as e:
        print(f"❌ Evidence Store Tool - CREATE: ERROR - {e}")
        return None

def test_web_search():
    """Test Web Search Tool"""
    print("\n🧪 Testing Web Search Tool...")
    
    tool = WebSearchTool()
    
    result = tool._run(
        query="startup market validation strategies",
        num_results=3,
        search_type="general"
    )
    
    print(f"Search result: {result}")
    
    try:
        result_data = json.loads(result)
        if result_data.get("status") == "success" and len(result_data.get("results", [])) > 0:
            print("✅ Web Search Tool: PASSED")
            return True
        else:
            print("❌ Web Search Tool: FAILED")
            return False
    except Exception as e:
        print(f"❌ Web Search Tool: ERROR - {e}")
        return False

def test_report_generator():
    """Test Report Generator Tool"""
    print("\n🧪 Testing Report Generator Tool...")
    
    tool = ReportGeneratorTool()
    
    test_content = {
        "title": "Test Strategic Analysis Report",
        "project_name": "Test Project",
        "executive_summary": "This is a test executive summary for the strategic analysis.",
        "key_findings": "- Test finding 1\n- Test finding 2\n- Test finding 3",
        "recommendations": "1. Test recommendation 1\n2. Test recommendation 2",
        "evidence_summary": "Based on test evidence and analysis.",
        "next_steps": "- Execute test plan\n- Validate assumptions",
        "evidence_count": 5
    }
    
    result = tool._run(
        content=test_content,
        format="markdown",
        include_visuals=True
    )
    
    print(f"Report result: {result}")
    
    try:
        result_data = json.loads(result)
        if result_data.get("status") == "success":
            print("✅ Report Generator Tool: PASSED")
            return True
        else:
            print("❌ Report Generator Tool: FAILED")
            return False
    except Exception as e:
        print(f"❌ Report Generator Tool: ERROR - {e}")
        return False

def test_vector_search():
    """Test Vector Search Tool"""
    print("\n🧪 Testing Vector Search Tool...")
    
    tool = VectorSearchTool()
    
    result = tool._run(
        query="market validation evidence",
        project_id="test-project-123",
        match_threshold=0.7,
        match_count=5
    )
    
    print(f"Vector search result: {result}")
    
    try:
        result_data = json.loads(result)
        if result_data.get("status") == "success":
            print("✅ Vector Search Tool: PASSED")
            return True
        else:
            print("❌ Vector Search Tool: FAILED")
            return False
    except Exception as e:
        print(f"❌ Vector Search Tool: ERROR - {e}")
        return False

def main():
    """Run all tool tests"""
    print("🚀 StartupAI CrewAI Tools Test Suite")
    print("=" * 50)
    
    # Test results
    results = {
        "evidence_store": False,
        "web_search": False,
        "report_generator": False,
        "vector_search": False
    }
    
    # Run tests
    evidence_id = test_evidence_store()
    results["evidence_store"] = evidence_id is not None
    
    results["web_search"] = test_web_search()
    results["report_generator"] = test_report_generator()
    results["vector_search"] = test_vector_search()
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results.values())
    total = len(results)
    
    for tool, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"{tool.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Tools are ready for CrewAI integration!")
        return True
    else:
        print("⚠️  Some tests failed - Check implementation before proceeding")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
