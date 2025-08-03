Feature: Strategyzer Customer Discovery Workflow
  As a business consultant using Strategyzer methodology
  I want to conduct comprehensive customer discovery
  So that I can identify jobs-to-be-done, pains, and gains for value proposition design

  Background:
    Given the AI consulting platform is running
    And the Strategyzer-powered agents are available
    And I have a test client in the system

  Scenario: Customer Discovery Agent generates structured insights
    Given I have client information for discovery
    When I run the customer discovery workflow
    Then the agent should identify functional jobs-to-be-done
    And the agent should identify emotional jobs-to-be-done
    And the agent should identify social jobs-to-be-done
    And the agent should list customer pain points
    And the agent should list customer desired gains
    And the response should be in valid JSON format
    And the response should include canvas-ready data structures

  Scenario: Customer Discovery integrates with Value Proposition Canvas
    Given I have completed customer discovery
    When I generate a Value Proposition Canvas
    Then the canvas should use customer jobs from discovery
    And the canvas should use customer pains from discovery
    And the canvas should use customer gains from discovery
    And the canvas should suggest relevant pain relievers
    And the canvas should suggest relevant gain creators

  Scenario: Multi-agent orchestration for complete customer profile
    Given I start a discovery workflow
    When the intake agent processes client information
    And the research agent analyzes market context
    And the canvas drafting agent creates initial frameworks
    And the validation plan agent designs experiments
    Then each agent should build upon previous agent outputs
    And the final output should be a comprehensive customer profile
    And all artifacts should be stored with proper metadata
    And the workflow should maintain client context throughout
