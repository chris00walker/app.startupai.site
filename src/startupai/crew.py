"""
StartupAI CrewAI Crew - Official Structure
Follows CrewAI AMP deployment requirements
"""

from typing import List, Optional
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
    Coordinates 6 specialized agents for comprehensive strategic analysis:
    - Research Agent: Evidence discovery
    - Analysis Agent: Pattern recognition
    - Validation Agent: Quality verification
    - Synthesis Agent: Insight combination
    - Reporting Agent: Report generation
    - Orchestration Agent: Workflow coordination
    """
    
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    agents: List[BaseAgent]
    tasks: List[Task]
    
    # Lazy-initialized tools (created on first access)
    _evidence_store: Optional[EvidenceStoreTool] = None
    _vector_search: Optional[VectorSearchTool] = None
    _web_search: Optional[WebSearchTool] = None
    _report_generator: Optional[ReportGeneratorTool] = None
    
    @property
    def evidence_store(self) -> EvidenceStoreTool:
        """Lazy-initialize evidence store tool."""
        if self._evidence_store is None:
            self._evidence_store = EvidenceStoreTool()
        return self._evidence_store
    
    @property
    def vector_search(self) -> VectorSearchTool:
        """Lazy-initialize vector search tool."""
        if self._vector_search is None:
            self._vector_search = VectorSearchTool()
        return self._vector_search
    
    @property
    def web_search(self) -> WebSearchTool:
        """Lazy-initialize web search tool."""
        if self._web_search is None:
            self._web_search = WebSearchTool()
        return self._web_search
    
    @property
    def report_generator(self) -> ReportGeneratorTool:
        """Lazy-initialize report generator tool."""
        if self._report_generator is None:
            self._report_generator = ReportGeneratorTool()
        return self._report_generator
    
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
    
    @agent
    def orchestration_agent(self) -> Agent:
        """Orchestration Agent - Workflow coordination and quality control."""
        return Agent(
            config=self.agents_config['orchestration_agent'], # type: ignore[index]
            tools=[self.evidence_store],
            verbose=True,
        )
    
    @task
    def evidence_collection_task(self) -> Task:
        """Task for evidence discovery and collection."""
        return Task(
            config=self.tasks_config['evidence_collection'], # type: ignore[index]
            agent=self.research_agent(),
        )
    
    @task
    def evidence_analysis_task(self) -> Task:
        """Task for pattern recognition in evidence."""
        return Task(
            config=self.tasks_config['evidence_analysis'], # type: ignore[index]
            agent=self.analysis_agent(),
        )
    
    @task
    def evidence_validation_task(self) -> Task:
        """Task for evidence quality verification."""
        return Task(
            config=self.tasks_config['evidence_validation'], # type: ignore[index]
            agent=self.validation_agent(),
        )
    
    @task
    def insight_synthesis_task(self) -> Task:
        """Task for combining insights into narrative."""
        return Task(
            config=self.tasks_config['insight_synthesis'], # type: ignore[index]
            agent=self.synthesis_agent(),
        )
    
    @task
    def report_generation_task(self) -> Task:
        """Task for generating final report."""
        return Task(
            config=self.tasks_config['report_generation'], # type: ignore[index]
            agent=self.reporting_agent(),
            output_file='output/strategic_analysis.md',
        )
    
    @task
    def workflow_orchestration_task(self) -> Task:
        """Task for workflow coordination and quality control."""
        return Task(
            config=self.tasks_config['workflow_orchestration'], # type: ignore[index]
            agent=self.orchestration_agent(),
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
