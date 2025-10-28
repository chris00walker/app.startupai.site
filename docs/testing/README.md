# Testing Documentation

This directory contains comprehensive testing documentation for the StartupAI platform, covering both the marketing site (startupai.site) and the product platform (app.startupai.site).

## Overview

The StartupAI testing strategy follows specification-driven testing principles, ensuring that all features deliver exactly what marketing promises to users. Our testing framework validates business outcomes and user experience specifications rather than just technical implementation.

## Testing Categories

### 1. Business Requirements Tests
- **Purpose**: Validate that the product delivers on marketing promises
- **Location**: `__tests__/business-requirements/`
- **Coverage**: Marketing promise delivery, universal access, AI-powered analysis
- **Success Criteria**: All promised deliverables accessible to users

### 2. User Journey Tests  
- **Purpose**: Validate complete user experience from signup to value delivery
- **Location**: `__tests__/user-journey/`
- **Coverage**: 15-step onboarding journey, conversation flow, results delivery
- **Success Criteria**: >90% journey completion, >4.0/5 satisfaction scores

### 3. Accessibility Tests
- **Purpose**: Ensure WCAG 2.2 AA compliance and inclusive design
- **Location**: `__tests__/accessibility/`
- **Coverage**: WCAG 2.0/2.1/2.2 standards, AI-specific accessibility patterns
- **Success Criteria**: 100% automated accessibility test pass rate

### 4. API Contract Tests
- **Purpose**: Validate API endpoints meet specification requirements
- **Location**: `__tests__/api-contracts/`
- **Coverage**: Request/response validation, error handling, authentication
- **Success Criteria**: All API contracts validated against OpenAPI specs

### 5. Success Metrics Tests
- **Purpose**: Measure and validate business success metrics
- **Location**: `__tests__/success-metrics/`
- **Coverage**: Conversation quality, data quality, workflow success
- **Success Criteria**: All metrics meet or exceed target thresholds

## Test Framework

### Core Technologies
- **Jest**: Primary testing framework with custom matchers
- **Testing Library**: React component testing with accessibility focus
- **Axe-core**: Automated accessibility testing
- **Playwright**: End-to-end testing for user journeys
- **Supertest**: API endpoint testing

### Custom Matchers
- `toBeWithinRange(min, max)`: Validate numeric ranges for success metrics
- `toMeetSuccessMetric(threshold)`: Validate business success criteria
- `toBeAccessible()`: Validate WCAG compliance using axe-core
- `toMatchAPIContract(schema)`: Validate API responses against contracts

### Test Utilities
- **APIResponseBuilder**: Generate realistic API responses for testing
- **UserJourneyValidator**: Simulate and validate complete user journeys
- **AccessibilityTester**: Comprehensive WCAG compliance testing
- **PerformanceMonitor**: Track and validate performance metrics

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Categories
```bash
# Business requirements
pnpm test:business

# User journey validation
pnpm test:journey

# Accessibility compliance
pnpm test:a11y

# API contracts
pnpm test:api

# Success metrics
pnpm test:metrics
```

### Coverage Reports
```bash
pnpm test:coverage
```

## Test Data

### Specification Data
Test data is extracted directly from business specification documents:
- `onboarding-agent-integration.md`: Business requirements and deliverables
- `onboarding-journey-map.md`: 15-step user journey validation
- `accessibility-standards.md`: WCAG compliance requirements
- `onboarding-api-endpoints.md`: API contract specifications

### Mock Data
- **User Profiles**: Realistic user data for different subscription tiers
- **Conversation Data**: Sample conversations with quality metrics
- **API Responses**: Standardized responses for contract testing
- **Accessibility Scenarios**: Test cases for different disability types

## Quality Gates

### Pre-Deployment Requirements
All tests must pass before deployment:
- ✅ Business requirements: 100% marketing promise delivery
- ✅ User journey: >90% completion rate, >4.0/5 satisfaction
- ✅ Accessibility: 100% WCAG 2.2 AA compliance
- ✅ API contracts: All endpoints validated
- ✅ Success metrics: All thresholds met

### Continuous Integration
- **GitHub Actions**: Automated test runs on every commit
- **Quality Checks**: Prevent deployment if tests fail
- **Coverage Requirements**: Minimum 80% code coverage
- **Performance Budgets**: Response time and bundle size limits

## Documentation

### Test Specifications
- [Business Requirements Testing](./business-requirements.md)
- [User Journey Validation](./user-journey.md)
- [Accessibility Testing](./accessibility.md)
- [API Contract Testing](./api-contracts.md)
- [Success Metrics Framework](./success-metrics.md)

### Implementation Guides
- [Writing Specification-Driven Tests](./writing-tests.md)
- [Custom Matcher Development](./custom-matchers.md)
- [Test Data Management](./test-data.md)
- [CI/CD Integration](./ci-cd.md)

## Success Metrics

### Current Performance
- **Test Suite Execution**: <5 minutes for full suite
- **Coverage**: >95% for critical business logic
- **Accessibility**: 100% WCAG 2.2 AA compliance
- **API Reliability**: >99.9% contract validation success
- **User Satisfaction**: >4.2/5 average satisfaction score

### Target Metrics
- **Conversation Quality**: >85% completion, >3.5/5 quality rating
- **Data Quality**: >80% segment clarity, >75% problem strength
- **Workflow Success**: >90% trigger rate, >95% completion rate
- **Performance**: <3s page load, <500ms API response times

## Maintenance

### Regular Reviews
- **Weekly**: Test result analysis and failure investigation
- **Monthly**: Test coverage review and gap analysis
- **Quarterly**: Specification alignment and test strategy updates
- **Annually**: Framework evaluation and technology updates

### Documentation Updates
All testing documentation is maintained in sync with:
- Business specification changes
- API contract updates
- Accessibility standard updates
- User experience improvements

---

**Last Updated**: October 27, 2025  
**Maintained By**: Development Team  
**Review Cycle**: Monthly  
**Next Review**: November 27, 2025
