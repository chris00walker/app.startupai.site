@wip @platform @export
Feature: Multi-format canvas export
  As a strategist
  I want to export a completed Value Proposition Canvas in multiple formats
  So that I can share branded, presentation-ready deliverables

  Background:
    Given a completed Value Proposition Canvas exists for account "demo-client"

  Scenario: Multi-format canvas export
    Given I have a completed Value Proposition Canvas
    When I request export in presentation format
    Then the system should generate high-resolution PDF
    And create editable SVG version
    And provide PowerPoint-compatible PNG
    And apply client branding if configured
    And include metadata and generation timestamp

  Scenario: Branded deliverable customization
    Given I have client branding requirements
    When I configure brand colors and logos
    Then all exported canvases should reflect client branding
    And maintain Strategyzer visual standards
    And ensure readability and professional appearance
    And provide brand compliance validation
