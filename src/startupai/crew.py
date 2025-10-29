"""
StartupAI CrewAI Crew - Official Structure
Follows CrewAI AMP deployment requirements
"""

from typing import List
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent

try:
    from .tools import (
        EvidenceStoreTool,
        VectorSearchTool,
        WebSearchTool,
        ReportGeneratorTool,
    )
except ImportError:
    from startupai.tools import (
        EvidenceStoreTool,
        VectorSearchTool,
        WebSearchTool,
        ReportGeneratorTool,
    )


@CrewBase
class StartupAICrew:
    """
    StartupAI Evidence-Led Strategy Crew
    
    Official CrewAI structure for AMP deployment.
    Coordinates 6 specialized agents for comprehensive strategic analysis.
    """
    
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    agents: List[BaseAgent]
    tasks: List[Task]
    
    def __init__(self):
        """Initialize tools."""
        self.evidence_store = EvidenceStoreTool()
        self.vector_search = VectorSearchTool()
        self.web_search = WebSearchTool()
        self.report_generator = ReportGeneratorTool()
    
    @agent
    def research_agent(self) -> Agent:
        """Research Agent - Evidence discovery and collection."""
        return Agent(
            config=self.agents_config['research_agent'], # type: ignore[index]
            tools=[self.web_search, self.evidence_store],
            verbose=True,
        )
    
    @agent
    def analysis_agent(self) -> Agent:
        """Analysis Agent - Pattern recognition and insight extraction."""
        return Agent(
            config=self.agents_config['analysis_agent'], # type: ignore[index]
            tools=[self.evidence_store, self.vector_search],
            verbose=True,
        )
    
    @agent
    def validation_agent(self) -> Agent:
        """Validation Agent - Evidence quality and credibility verification."""
        return Agent(
            config=self.agents_config['validation_agent'], # type: ignore[index]
            tools=[self.web_search, self.evidence_store],
            verbose=True,
        )
    
    @agent
    def synthesis_agent(self) -> Agent:
        """Synthesis Agent - Insight combination and narrative building."""
        return Agent(
            config=self.agents_config['synthesis_agent'], # type: ignore[index]
            tools=[self.evidence_store],
            verbose=True,
        )
    
    @agent
    def reporting_agent(self) -> Agent:
        """Reporting Agent - Professional report generation."""
        return Agent(
            config=self.agents_config['reporting_agent'], # type: ignore[index]
            tools=[self.report_generator],
            verbose=True,
        )
    
    @task
    def evidence_collection_task(self) -> Task:
        """Task for evidence discovery and collection."""
        return Task(
            config=self.tasks_config['evidence_collection'], # type: ignore[index]
        )
    
    @task
    def evidence_analysis_task(self) -> Task:
        """Task for pattern recognition in evidence."""
        return Task(
            config=self.tasks_config['evidence_analysis'], # type: ignore[index]
        )
    
    @task
    def evidence_validation_task(self) -> Task:
        """Task for evidence quality verification."""
        return Task(
            config=self.tasks_config['evidence_validation'], # type: ignore[index]
        )
    
    @task
    def insight_synthesis_task(self) -> Task:
        """Task for combining insights into narrative."""
        return Task(
            config=self.tasks_config['insight_synthesis'], # type: ignore[index]
        )
    
    @task
    def report_generation_task(self) -> Task:
        """Task for generating final report."""
        return Task(
            config=self.tasks_config['report_generation'], # type: ignore[index]
            output_file='output/strategic_analysis.md',
        )
    
    @crew
    def crew(self) -> Crew:
        """
        Creates the StartupAI Crew with sequential process.
        This is the method CrewAI AMP calls.
        """
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
