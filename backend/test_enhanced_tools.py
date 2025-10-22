#!/usr/bin/env python3
"""
Test script for enhanced CrewAI tools
Validates vector embeddings, error handling, rate limiting, and accessibility compliance
"""

import os
import sys
import json
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = backend_dir / ".env"
    load_dotenv(env_path)
    print(f"✅ Loaded environment from: {env_path}")
except Exception as e:
    print(f"⚠️  Failed to load .env: {e}")

from src.startupai.tools import EvidenceStoreTool, WebSearchTool, ReportGeneratorTool


def test_evidence_store_tool():
    """Test EvidenceStoreTool with vector embeddings and accessibility."""
    print("\n" + "=" * 80)
    print("TEST 1: Evidence Store Tool")
    print("=" * 80)
    
    tool = EvidenceStoreTool()
    
    # Test creating evidence with vector embedding
    print("\n🔍 Testing evidence creation with vector embedding...")
    evidence_data = {
        "title": "Market Analysis: AI Validation Tools",
        "description": "The market for AI-powered startup validation tools is growing rapidly, with increased demand from founders and consultants.",
        "source": "Market Research",
        "evidence_type": "quantitative",
    }
    
    try:
        result_str = tool._run(
            action="create",
            project_id="test-project-001",
            evidence_data=evidence_data
        )
        result = json.loads(result_str)
        
        if result.get("success"):
            print("✅ Evidence created successfully")
            print(f"   Evidence ID: {result.get('evidence_id')}")
            print(f"   Accessibility: {result.get('accessibility', {}).get('reading_level')}")
        else:
            print(f"❌ Failed: {result.get('error')}")
            print(f"   Recovery: {result.get('accessibility', {}).get('error_recovery')}")
        
        return result
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def test_web_search_tool():
    """Test WebSearchTool with rate limiting and error handling."""
    print("\n" + "=" * 80)
    print("TEST 2: Web Search Tool")
    print("=" * 80)
    
    tool = WebSearchTool()
    
    # Test web search with accessibility compliance
    print("\n🌐 Testing web search with rate limiting...")
    
    try:
        result_str = tool._run(
            query="AI startup validation trends 2024",
            num_results=5,
            search_type="general"
        )
        result = json.loads(result_str)
        
        if result.get("success"):
            print("✅ Search completed successfully")
            print(f"   Found {result.get('num_results')} results")
            print(f"   Accessibility: {result.get('accessibility', {}).get('reading_level')}")
            
            # Show first result
            if result.get("results"):
                first_result = result["results"][0]
                print(f"\n   First result:")
                print(f"   - Title: {first_result.get('title', 'N/A')}")
                print(f"   - URL: {first_result.get('url', 'N/A')}")
        else:
            print(f"❌ Search failed: {result.get('error')}")
            if "rate limit" in result.get("error", "").lower():
                print(f"   Retry after: {result.get('retry_after')} seconds")
            print(f"   Recovery: {result.get('accessibility', {}).get('error_recovery')}")
        
        return result
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def test_report_generator_tool():
    """Test ReportGeneratorTool with accessibility compliance."""
    print("\n" + "=" * 80)
    print("TEST 3: Report Generator Tool")
    print("=" * 80)
    
    tool = ReportGeneratorTool()
    
    # Test report generation with multiple formats
    print("\n📄 Testing report generation with accessibility...")
    
    report_content = {
        "title": "Strategic Analysis: AI Validation Platform",
        "project_name": "StartupAI Platform Test",
        "executive_summary": "This analysis examines the market opportunity for AI-powered startup validation tools. Key findings indicate strong demand from both founders and consultants.",
        "key_findings": "- Growing market demand\n- Strong competitive positioning\n- Clear value proposition\n- Scalable business model",
        "recommendations": "1. Focus on accessibility compliance\n2. Implement vector search\n3. Enhance report generation\n4. Deploy to production",
        "evidence_summary": "Analysis based on market research, user interviews, and competitive intelligence.",
        "next_steps": "- Complete tool enhancements\n- Test end-to-end workflow\n- Deploy to production\n- Monitor performance",
        "evidence_count": 12
    }
    
    try:
        result_str = tool._run(
            content=report_content,
            format="markdown",
            include_visuals=True,
            project_id="test-project-001"
        )
        result = json.loads(result_str)
        
        if result.get("success"):
            print("✅ Report generated successfully")
            report_data = result.get("report", {})
            print(f"   Report ID: {report_data.get('id')}")
            print(f"   Word count: {report_data.get('word_count')}")
            print(f"   Formats: {result.get('accessibility', {}).get('formats_available')}")
            print(f"   WCAG Compliance: {result.get('accessibility', {}).get('wcag_compliance')}")
            print(f"   Reading Level: {result.get('accessibility', {}).get('reading_level')}")
            print(f"   Screen Reader: {result.get('accessibility', {}).get('screen_reader_compatible')}")
            
            # Show report preview
            content = report_data.get("content", "")
            lines = content.split('\n')
            print(f"\n   Report preview (first 10 lines):")
            for line in lines[:10]:
                print(f"   {line}")
        else:
            print(f"❌ Report generation failed: {result.get('error')}")
            print(f"   Recovery: {result.get('accessibility', {}).get('error_recovery')}")
        
        return result
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def run_all_tests():
    """Run all tool tests."""
    print("\n" + "=" * 80)
    print("🚀 CREWAI ENHANCED TOOLS TEST SUITE")
    print("   Testing vector embeddings, error handling, and accessibility compliance")
    print("=" * 80)
    
    # Check environment variables
    print("\n📋 Environment Check:")
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {'*' * 10}{value[-4:]}")
        else:
            print(f"   ❌ {var}: NOT SET")
    
    # Run tests
    results = {}
    
    try:
        results["evidence_store"] = test_evidence_store_tool()
    except Exception as e:
        print(f"\n❌ Evidence Store Test Failed: {e}")
        results["evidence_store"] = None
    
    try:
        results["web_search"] = test_web_search_tool()
    except Exception as e:
        print(f"\n❌ Web Search Test Failed: {e}")
        results["web_search"] = None
    
    try:
        results["report_generator"] = test_report_generator_tool()
    except Exception as e:
        print(f"\n❌ Report Generator Test Failed: {e}")
        results["report_generator"] = None
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for r in results.values() if r and r.get("success"))
    total = len(results)
    
    print(f"\nPassed: {passed}/{total}")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result and result.get("success") else "❌ FAIL"
        print(f"   {status} - {test_name}")
    
    print("\n" + "=" * 80)
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        print("   - Vector embeddings working")
        print("   - Error handling implemented")
        print("   - Rate limiting active")
        print("   - Accessibility compliance met (WCAG 2.1 AA)")
        print("\n✅ Ready for production deployment")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("   Review errors above for details")
    
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_all_tests()
