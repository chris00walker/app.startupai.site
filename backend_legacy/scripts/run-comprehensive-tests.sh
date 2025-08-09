#!/bin/bash

# Comprehensive Test Runner for Strategyzer AI Platform
# Executes TDD/BDD test suite on Google Cloud Platform

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Test Suite for Strategyzer AI Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false
E2E_TESTS_PASSED=false
COVERAGE_THRESHOLD=80

echo -e "${BLUE}📋 Test Environment Information${NC}"
echo "Node.js Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Platform: $(uname -s)"
echo "Architecture: $(uname -m)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}' || echo 'N/A')"
echo "CPU Cores: $(nproc || echo 'N/A')"
echo ""

# Check if OpenAI API key is available (required for integration tests)
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: OPENAI_API_KEY not set. Some integration tests may be skipped.${NC}"
fi

echo -e "${BLUE}🧪 Phase 1: Unit Tests${NC}"
echo "Testing Strategyzer agent prompt generation and utilities..."
if npm run test:unit -- --reporter=verbose; then
    echo -e "${GREEN}✅ Unit tests passed!${NC}"
    UNIT_TESTS_PASSED=true
else
    echo -e "${RED}❌ Unit tests failed!${NC}"
    echo "Unit test failures detected. Continuing with other tests..."
fi
echo ""

echo -e "${BLUE}🔗 Phase 2: Integration Tests${NC}"
echo "Testing Strategyzer workflow orchestration and database integration..."
if npm run test:integration -- --reporter=verbose; then
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
    INTEGRATION_TESTS_PASSED=true
else
    echo -e "${RED}❌ Integration tests failed!${NC}"
    echo "Integration test failures detected. Continuing with E2E tests..."
fi
echo ""

echo -e "${BLUE}🌐 Phase 3: End-to-End Tests${NC}"
echo "Testing complete Strategyzer consulting scenarios..."
if npm run test:e2e -- --reporter=verbose; then
    echo -e "${GREEN}✅ End-to-end tests passed!${NC}"
    E2E_TESTS_PASSED=true
else
    echo -e "${RED}❌ End-to-end tests failed!${NC}"
    echo "E2E test failures detected."
fi
echo ""

echo -e "${BLUE}📊 Phase 4: Code Coverage Analysis${NC}"
echo "Generating comprehensive code coverage report..."
if npm run test:coverage -- --reporter=verbose; then
    echo -e "${GREEN}✅ Coverage analysis completed!${NC}"
    
    # Extract coverage percentage (this might need adjustment based on actual output format)
    COVERAGE_PERCENT=$(npm run test:coverage 2>/dev/null | grep -o 'All files.*[0-9]\+\.[0-9]\+' | grep -o '[0-9]\+\.[0-9]\+' | tail -1 || echo "0")
    
    if [ -n "$COVERAGE_PERCENT" ]; then
        echo "Current code coverage: ${COVERAGE_PERCENT}%"
        if (( $(echo "$COVERAGE_PERCENT >= $COVERAGE_THRESHOLD" | bc -l) )); then
            echo -e "${GREEN}✅ Coverage meets threshold (${COVERAGE_THRESHOLD}%)${NC}"
        else
            echo -e "${YELLOW}⚠️  Coverage below threshold (${COVERAGE_THRESHOLD}%). Current: ${COVERAGE_PERCENT}%${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Coverage analysis failed!${NC}"
fi
echo ""

echo -e "${BLUE}🔍 Phase 5: Strategyzer Framework Validation${NC}"
echo "Validating Strategyzer methodology implementation..."

# Custom validation tests for Strategyzer frameworks
echo "Checking Value Proposition Canvas structure..."
if node -e "
const { buildValuePropositionPrompt } = require('./server/utils/agentRunner.js');
const prompt = buildValuePropositionPrompt({ clientId: 'test' });
const hasRequiredElements = prompt.includes('Customer Profile') && 
                           prompt.includes('Value Map') && 
                           prompt.includes('Pain Relievers') && 
                           prompt.includes('Gain Creators');
if (!hasRequiredElements) {
  console.error('❌ Value Proposition Canvas prompt missing required elements');
  process.exit(1);
}
console.log('✅ Value Proposition Canvas structure validated');
"; then
    echo -e "${GREEN}✅ Value Proposition Canvas validation passed${NC}"
else
    echo -e "${RED}❌ Value Proposition Canvas validation failed${NC}"
fi

echo "Checking Business Model Canvas elements..."
if node -e "
const { buildStrategyzerPrompt } = require('./server/utils/agentRunner.js');
const prompt = buildStrategyzerPrompt('businessModelAgent', { clientId: 'test' });
const hasBusinessElements = prompt.includes('business model') || prompt.includes('Strategyzer');
if (!hasBusinessElements) {
  console.error('❌ Business Model prompt missing Strategyzer elements');
  process.exit(1);
}
console.log('✅ Business Model Canvas structure validated');
"; then
    echo -e "${GREEN}✅ Business Model Canvas validation passed${NC}"
else
    echo -e "${RED}❌ Business Model Canvas validation failed${NC}"
fi

echo "Checking Testing Business Ideas framework..."
if node -e "
const { buildTestingBusinessIdeasPrompt } = require('./server/utils/agentRunner.js');
const prompt = buildTestingBusinessIdeasPrompt({ clientId: 'test' });
const hasTestingElements = prompt.includes('Testing Business Ideas') && 
                          prompt.includes('hypotheses') && 
                          prompt.includes('experiments');
if (!hasTestingElements) {
  console.error('❌ Testing Business Ideas prompt missing required elements');
  process.exit(1);
}
console.log('✅ Testing Business Ideas framework validated');
"; then
    echo -e "${GREEN}✅ Testing Business Ideas validation passed${NC}"
else
    echo -e "${RED}❌ Testing Business Ideas validation failed${NC}"
fi
echo ""

echo -e "${BLUE}📈 Test Results Summary${NC}"
echo "=================================================="
echo -e "Unit Tests:        $([ "$UNIT_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo -e "Integration Tests: $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo -e "E2E Tests:         $([ "$E2E_TESTS_PASSED" = true ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo ""

# Overall test result
if [ "$UNIT_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Strategyzer AI Platform is ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}✨ Key Validations Completed:${NC}"
    echo "• Strategyzer framework prompt generation"
    echo "• Value Proposition Canvas creation"
    echo "• Business Model Canvas generation"
    echo "• Testing Business Ideas methodology"
    echo "• Multi-agent workflow orchestration"
    echo "• Database integration and persistence"
    echo "• End-to-end consulting scenarios"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED! Review the failures above before deployment.${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Recommended Actions:${NC}"
    if [ "$UNIT_TESTS_PASSED" = false ]; then
        echo "• Fix unit test failures in Strategyzer agent utilities"
    fi
    if [ "$INTEGRATION_TESTS_PASSED" = false ]; then
        echo "• Debug integration issues with workflow orchestration"
    fi
    if [ "$E2E_TESTS_PASSED" = false ]; then
        echo "• Resolve end-to-end scenario failures"
    fi
    echo "• Review logs above for specific error details"
    echo "• Ensure OpenAI API key is properly configured"
    echo "• Verify MongoDB connection and schema"
    echo ""
    exit 1
fi
