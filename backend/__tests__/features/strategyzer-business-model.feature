Feature: Strategyzer Business Model Generation
  As a business model designer using Osterwalder's methodology
  I want to create comprehensive Business Model Canvases
  So that I can design sustainable and scalable business models

  Background:
    Given the Strategyzer platform is running
    And I have value propositions defined
    And the Business Model Canvas agent is available

  Scenario: Generate complete Business Model Canvas
    Given I have value propositions for target customer segments
    When I request Business Model Canvas generation
    Then the agent should define customer segments
    And the agent should map value propositions to segments
    And the agent should identify distribution channels
    And the agent should design customer relationships
    And the agent should define revenue streams
    And the agent should identify key resources
    And the agent should map key activities
    And the agent should suggest key partnerships
    And the agent should estimate cost structure
    And all elements should be interconnected and coherent

  Scenario: Business model validation and testing
    Given I have a complete Business Model Canvas
    When I run business model validation
    Then the agent should identify critical assumptions
    And the agent should suggest validation experiments
    And the agent should recommend metrics for each building block
    And the agent should provide risk assessment
    And the validation plan should follow Testing Business Ideas methodology

  Scenario: Business model iteration and optimization
    Given I have validation results from experiments
    When I request business model optimization
    Then the agent should suggest model improvements
    And the agent should identify pivot opportunities
    And the agent should recommend scaling strategies
    And the agent should update the canvas based on learnings
    And the iteration should maintain strategic coherence
