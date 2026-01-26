---
purpose: "User stories for MCP tool implementation"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# MCP Tool User Stories

Stories for implementing all 35 MCP tools from [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md).

## Story Format

Each story validates:
1. **Tool Definition**: MCP tool is defined with correct schema
2. **Integration**: Tool is wired to target agents
3. **Error Handling**: Graceful degradation on failures
4. **Rate Limiting**: Respects provider limits where applicable

---

## EXISTS Tools (US-MT01 - US-MT13)

Direct imports from crewai_tools - ready to wire.

### US-MT01: SerperDevTool Integration

**As a** CrewAI agent,
**I want to** use SerperDevTool for web search,
**So that** I can research markets, competitors, and trends.

**Acceptance Criteria:**

**Given** SerperDevTool is configured with SERPER_API_KEY
**When** an agent calls the tool with a search query
**Then** relevant search results are returned with titles, snippets, and URLs

**Tool Reference:** `from crewai_tools import SerperDevTool`
**Target Agents:** D1, D2, D3, D4, J1, PAIN_RES, GAIN_RES, COMP_AN
**Cost:** API credits (~$0.001/search)

---

### US-MT02: ScrapeWebsiteTool Integration

**As a** CrewAI agent,
**I want to** use ScrapeWebsiteTool to extract web content,
**So that** I can analyze competitor websites and landing pages.

**Acceptance Criteria:**

**Given** a valid URL is provided
**When** an agent calls the scrape tool
**Then** clean text content is extracted from the page
**And** JavaScript-rendered content is handled

**Tool Reference:** `from crewai_tools import ScrapeWebsiteTool`
**Target Agents:** D1, D2, D3, COMP_AN
**Cost:** FREE

---

### US-MT03: FileReadTool Integration

**As a** CrewAI agent,
**I want to** use FileReadTool to read local files,
**So that** I can access configuration and data files.

**Acceptance Criteria:**

**Given** a file path within the project
**When** an agent calls FileReadTool
**Then** file contents are returned as text
**And** appropriate errors are raised for missing files

**Tool Reference:** `from crewai_tools import FileReadTool`
**Target Agents:** G1, G2, G3
**Cost:** FREE

---

### US-MT04: DirectoryReadTool Integration

**As a** CrewAI agent,
**I want to** use DirectoryReadTool to list directory contents,
**So that** I can discover available files and templates.

**Acceptance Criteria:**

**Given** a directory path
**When** an agent calls DirectoryReadTool
**Then** list of files and subdirectories is returned

**Tool Reference:** `from crewai_tools import DirectoryReadTool`
**Target Agents:** G1, G2, G3
**Cost:** FREE

---

### US-MT05: WebSearchTool Integration

**As a** CrewAI agent,
**I want to** use WebSearchTool for general web searches,
**So that** I can find diverse information sources.

**Acceptance Criteria:**

**Given** a search query
**When** an agent calls WebSearchTool
**Then** relevant results from multiple search engines are returned

**Tool Reference:** `from crewai_tools import WebSearchTool`
**Target Agents:** D2, J1
**Cost:** Varies by backend

---

### US-MT06: YouTubeSearchTool Integration

**As a** CrewAI agent,
**I want to** use YouTubeSearchTool to find relevant videos,
**So that** I can discover customer pain points from video content.

**Acceptance Criteria:**

**Given** a search query
**When** an agent calls YouTubeSearchTool
**Then** relevant YouTube videos with metadata are returned

**Tool Reference:** `from crewai_tools import YouTubeSearchTool`
**Target Agents:** D2
**Cost:** FREE

---

### US-MT07: PDFSearchTool Integration

**As a** CrewAI agent,
**I want to** use PDFSearchTool to search within PDF documents,
**So that** I can extract insights from reports and whitepapers.

**Acceptance Criteria:**

**Given** a PDF file path and search query
**When** an agent calls PDFSearchTool
**Then** matching content with page references is returned

**Tool Reference:** `from crewai_tools import PDFSearchTool`
**Target Agents:** D2, G1
**Cost:** FREE

---

### US-MT08: CSVSearchTool Integration

**As a** CrewAI agent,
**I want to** use CSVSearchTool to query CSV data,
**So that** I can analyze structured data files.

**Acceptance Criteria:**

**Given** a CSV file path
**When** an agent calls CSVSearchTool with a query
**Then** matching rows and aggregations are returned

**Tool Reference:** `from crewai_tools import CSVSearchTool`
**Target Agents:** D4, G1
**Cost:** FREE

---

### US-MT09: JSONSearchTool Integration

**As a** CrewAI agent,
**I want to** use JSONSearchTool to query JSON data,
**So that** I can analyze API responses and configuration.

**Acceptance Criteria:**

**Given** a JSON file path or string
**When** an agent calls JSONSearchTool
**Then** matching elements with JSONPath references are returned

**Tool Reference:** `from crewai_tools import JSONSearchTool`
**Target Agents:** D4, G1
**Cost:** FREE

---

### US-MT10: XMLSearchTool Integration

**As a** CrewAI agent,
**I want to** use XMLSearchTool to parse XML documents,
**So that** I can extract data from legacy formats.

**Acceptance Criteria:**

**Given** an XML file path
**When** an agent calls XMLSearchTool
**Then** matching elements with XPath references are returned

**Tool Reference:** `from crewai_tools import XMLSearchTool`
**Target Agents:** G1
**Cost:** FREE

---

### US-MT11: TXTSearchTool Integration

**As a** CrewAI agent,
**I want to** use TXTSearchTool to search text files,
**So that** I can find content in plain text documents.

**Acceptance Criteria:**

**Given** a text file path and search pattern
**When** an agent calls TXTSearchTool
**Then** matching lines with context are returned

**Tool Reference:** `from crewai_tools import TXTSearchTool`
**Target Agents:** G1
**Cost:** FREE

---

### US-MT12: DOCXSearchTool Integration

**As a** CrewAI agent,
**I want to** use DOCXSearchTool to search Word documents,
**So that** I can extract content from business documents.

**Acceptance Criteria:**

**Given** a DOCX file path
**When** an agent calls DOCXSearchTool with a query
**Then** matching paragraphs and sections are returned

**Tool Reference:** `from crewai_tools import DOCXSearchTool`
**Target Agents:** G1
**Cost:** FREE

---

### US-MT13: CodeInterpreterTool Integration

**As a** CrewAI agent,
**I want to** use CodeInterpreterTool to execute Python code,
**So that** I can perform calculations and data analysis.

**Acceptance Criteria:**

**Given** valid Python code
**When** an agent calls CodeInterpreterTool
**Then** code executes in sandbox and results are returned
**And** execution is isolated from main system

**Tool Reference:** `from crewai_tools import CodeInterpreterTool`
**Target Agents:** D4, F1, V2
**Cost:** FREE (compute only)

---

## MCP Custom Tools (US-MT14 - US-MT23)

FastMCP tools deployed on Modal serverless.

### US-MT14: ForumScraperTool (forum_search)

**As a** CrewAI agent,
**I want to** search Reddit forums for customer insights,
**So that** I can discover pain points and jobs-to-be-done.

**Acceptance Criteria:**

**Given** a search query and target subreddits
**When** an agent calls forum_search
**Then** relevant posts with sentiment analysis are returned
**And** pain points are extracted and categorized

**MCP Tool:** `forum_search`
**Implementation:** asyncpraw + HuggingFace sentiment
**Target Agents:** D2, J1, PAIN_RES, GAIN_RES
**Cost:** FREE

---

### US-MT15: ReviewAnalysisTool (analyze_reviews)

**As a** CrewAI agent,
**I want to** analyze app store reviews,
**So that** I can understand competitor strengths and weaknesses.

**Acceptance Criteria:**

**Given** an app ID and platform (Google Play/App Store)
**When** an agent calls analyze_reviews
**Then** reviews with ratings, sentiment, and pain points are returned

**MCP Tool:** `analyze_reviews`
**Implementation:** google-play-scraper + app-store-scraper
**Target Agents:** D2, J1, PAIN_RES, GAIN_RES
**Cost:** FREE

---

### US-MT16: SocialListeningTool (social_listen)

**As a** CrewAI agent,
**I want to** monitor web and news for social signals,
**So that** I can track market sentiment and trends.

**Acceptance Criteria:**

**Given** keywords to monitor
**When** an agent calls social_listen
**Then** signals from web and news sources are returned with sentiment

**MCP Tool:** `social_listen`
**Implementation:** DuckDuckGo Search + HuggingFace
**Target Agents:** D2
**Cost:** FREE

---

### US-MT17: TrendAnalysisTool (analyze_trends)

**As a** CrewAI agent,
**I want to** analyze Google Trends data,
**So that** I can assess market momentum and timing.

**Acceptance Criteria:**

**Given** keywords (max 5) and region
**When** an agent calls analyze_trends
**Then** interest over time, related queries, and momentum are returned

**MCP Tool:** `analyze_trends`
**Implementation:** trendspyg
**Target Agents:** D2
**Cost:** FREE

---

### US-MT18: TranscriptionTool (transcribe_audio)

**As a** CrewAI agent,
**I want to** transcribe audio from customer interviews,
**So that** I can extract insights from verbal feedback.

**Acceptance Criteria:**

**Given** an audio file URL
**When** an agent calls transcribe_audio
**Then** full transcript with segments and timestamps is returned

**MCP Tool:** `transcribe_audio`
**Implementation:** faster-whisper (local)
**Target Agents:** D1
**Cost:** FREE (compute only)

---

### US-MT19: InsightExtractorTool (extract_insights)

**As a** CrewAI agent,
**I want to** extract structured insights from transcripts,
**So that** I can populate VPC canvas from interviews.

**Acceptance Criteria:**

**Given** an interview transcript
**When** an agent calls extract_insights
**Then** categorized insights (pain_points, jobs, gains) with quotes are returned

**MCP Tool:** `extract_insights`
**Implementation:** HuggingFace BART + LLM
**Target Agents:** D1, D4
**Cost:** FREE

---

### US-MT20: LandingPageGeneratorTool

**As a** CrewAI agent,
**I want to** generate landing page HTML from VPC data,
**So that** desirability tests have professional landing pages.

**Acceptance Criteria:**

**Given** VPC data and project brief
**When** an agent calls landing_page_generator
**Then** responsive HTML landing page is generated
**And** copy is customized from VPC value proposition
**And** images are sourced from Unsplash (free tier)

**MCP Tool:** `landing_page_generator`
**Implementation:** Blueprint Pattern (see US-AT01-AT05)
**Target Agents:** F2 (Landing Page Creator)
**Cost:** FREE
**Related Stories:** US-AT01, US-AT02, US-AT03, US-AT04, US-AT05

---

### US-MT21: AdCreativeGeneratorTool

**As a** CrewAI agent,
**I want to** generate platform-specific ad creatives,
**So that** desirability tests can run ads on Meta/Google.

**Acceptance Criteria:**

**Given** VPC data, target platform, and budget
**When** an agent calls ad_creative_generator
**Then** ad copy variants within platform limits are generated
**And** image specifications match platform requirements
**And** A/B test variations are included

**MCP Tool:** `ad_creative_generator`
**Implementation:** Platform Constraint Library (see US-AT06-AT08)
**Target Agents:** P1 (Advertising Strategist), P2 (Ad Creative Developer)
**Cost:** FREE
**Related Stories:** US-AT06, US-AT07, US-AT08

---

### US-MT22: StateManagerTool (get_project_state)

**As a** CrewAI agent,
**I want to** read and write project state,
**So that** validation progress persists across phases.

**Acceptance Criteria:**

**Given** a project ID
**When** an agent calls get_project_state
**Then** current phase state with VPC, evidence, and scores is returned

**Given** state updates
**When** an agent calls update_project_state
**Then** state is persisted to Supabase
**And** webhook notifies frontend of changes

**MCP Tool:** `get_project_state`, `update_project_state`
**Implementation:** Supabase client
**Target Agents:** All crews (start/end of tasks)
**Cost:** FREE

---

### US-MT23: HITLRequestTool (create_hitl_request)

**As a** CrewAI agent,
**I want to** create HITL checkpoint requests,
**So that** humans can review and approve AI work.

**Acceptance Criteria:**

**Given** checkpoint type and context data
**When** an agent calls create_hitl_request
**Then** approval_request is created in Supabase
**And** container terminates ($0 cost while waiting)
**And** frontend shows pending approval

**MCP Tool:** `create_hitl_request`
**Implementation:** Supabase + Modal checkpoint
**Target Agents:** G3 (Gate Manager), all phase completion agents
**Cost:** FREE
**Related Stories:** US-AH01-US-AH10

---

## MCP External Tools (US-MT24 - US-MT27)

Pre-built community MCP servers.

### US-MT24: AdPlatformTool (Meta)

**As a** CrewAI agent,
**I want to** manage Meta advertising campaigns,
**So that** desirability tests can run Facebook/Instagram ads.

**Acceptance Criteria:**

**Given** valid Meta API credentials
**When** an agent calls Meta Ads MCP tools
**Then** campaigns can be created, monitored, and optimized
**And** performance metrics are retrieved

**MCP Server:** [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp)
**Target Agents:** P1, P2, P3, D3
**Cost:** FREE (API access)

---

### US-MT25: AdPlatformTool (Google)

**As a** CrewAI agent,
**I want to** manage Google Ads campaigns,
**So that** desirability tests can run search/display ads.

**Acceptance Criteria:**

**Given** valid Google Ads API credentials
**When** an agent calls Google Ads MCP tools
**Then** campaigns can be queried via GAQL
**And** performance metrics are retrieved

**MCP Server:** [cohnen/google-ads-mcp](https://www.pulsemcp.com/servers/cohnen-google-ads)
**Target Agents:** P1, P2, P3
**Cost:** FREE (API access)

---

### US-MT26: InterviewSchedulerTool (Google Calendar)

**As a** CrewAI agent,
**I want to** schedule customer interviews,
**So that** discovery phase can gather qualitative data.

**Acceptance Criteria:**

**Given** available time slots and participant emails
**When** an agent calls Calendar MCP tools
**Then** calendar events are created with invites sent

**MCP Server:** Google Calendar MCP (community)
**Target Agents:** D1
**Cost:** FREE

---

### US-MT27: WebFetchTool (Official Fetch)

**As a** CrewAI agent,
**I want to** fetch and convert web content,
**So that** I can analyze web pages as markdown.

**Acceptance Criteria:**

**Given** a URL
**When** an agent calls fetch tool
**Then** HTML is converted to clean markdown
**And** redirects are followed

**MCP Server:** [Official Fetch Server](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
**Target Agents:** D2, Research agents
**Cost:** FREE

---

## LLM-Based Tools (US-MT28 - US-MT35)

Structured output generators using Pydantic schemas.

### US-MT28: SynthesisEngineTool

**As a** CrewAI agent,
**I want to** synthesize research into structured insights,
**So that** discovery findings are consolidated.

**Acceptance Criteria:**

**Given** raw research data from multiple sources
**When** an agent calls synthesis_engine
**Then** structured SynthesisResult with key findings is returned

**Output Schema:** `SynthesisResult` (Pydantic)
**Target Agents:** D4 (Synthesizer), G2
**Cost:** LLM tokens

---

### US-MT29: FitCalculatorTool

**As a** CrewAI agent,
**I want to** calculate VPD fit scores,
**So that** problem-solution fit is quantified.

**Acceptance Criteria:**

**Given** VPC data with customer profile and value map
**When** an agent calls fit_calculator
**Then** fit score (0-100) with breakdown by dimension is returned
**And** gap analysis identifies weak points

**Output Schema:** `FitScore` (Pydantic)
**Target Agents:** G2 (Fit Evaluator)
**Cost:** LLM tokens

---

### US-MT30: PivotRecommenderTool

**As a** CrewAI agent,
**I want to** generate pivot recommendations,
**So that** failing validations have clear next steps.

**Acceptance Criteria:**

**Given** current state and failure reasons
**When** an agent calls pivot_recommender
**Then** ranked pivot options with rationale are returned

**Output Schema:** `PivotRecommendation` (Pydantic)
**Target Agents:** G3 (Gate Manager)
**Cost:** LLM tokens

---

### US-MT31: EconomicsAnalyzerTool

**As a** CrewAI agent,
**I want to** analyze unit economics,
**So that** viability phase has financial projections.

**Acceptance Criteria:**

**Given** cost structure and revenue model
**When** an agent calls economics_analyzer
**Then** CAC, LTV, margins, and breakeven analysis are returned

**Output Schema:** `EconomicsAnalysis` (Pydantic)
**Target Agents:** V2 (Unit Economist)
**Cost:** LLM tokens

---

### US-MT32: FeasibilityAssessorTool

**As a** CrewAI agent,
**I want to** assess technical feasibility,
**So that** Phase 3 evaluates buildability.

**Acceptance Criteria:**

**Given** product concept and technical requirements
**When** an agent calls feasibility_assessor
**Then** feasibility score with risk factors is returned

**Output Schema:** `FeasibilityAssessment` (Pydantic)
**Target Agents:** F1 (Feasibility Architect)
**Cost:** LLM tokens

---

### US-MT33: BriefCompilerTool

**As a** CrewAI agent,
**I want to** compile structured briefs from user input,
**So that** Phase 0 produces Founder's Brief.

**Acceptance Criteria:**

**Given** Quick Start form responses
**When** an agent calls brief_compiler
**Then** structured EntrepreneurBrief with all sections is returned

**Output Schema:** `EntrepreneurBrief` (Pydantic)
**Target Agents:** O1 (Brief Compiler)
**Cost:** LLM tokens

---

### US-MT34: WTPAnalyzerTool

**As a** CrewAI agent,
**I want to** analyze willingness-to-pay signals,
**So that** pricing strategy is data-driven.

**Acceptance Criteria:**

**Given** market data and competitor pricing
**When** an agent calls wtp_analyzer
**Then** price sensitivity analysis with recommended ranges is returned

**Output Schema:** `WTPAnalysis` (Pydantic)
**Target Agents:** V1 (WTP Analyst)
**Cost:** LLM tokens

---

### US-MT35: GovernanceAuditorTool

**As a** CrewAI agent,
**I want to** audit validation process quality,
**So that** governance ensures reliable results.

**Acceptance Criteria:**

**Given** complete validation run data
**When** an agent calls governance_auditor
**Then** quality scores, bias checks, and recommendations are returned

**Output Schema:** `GovernanceAudit` (Pydantic)
**Target Agents:** GOV (Governance Auditor)
**Cost:** LLM tokens

---

## Implementation Roadmap

| Phase | Tools | Hours | Dependencies |
|-------|-------|-------|--------------|
| A: Core MCP | US-MT14-19, US-MT22-23 | 15h | Modal setup |
| B: Asset Gen | US-MT20-21 | 12h | US-AT01-AT08 |
| C: External | US-MT24-27 | 8h | API credentials |
| D: EXISTS | US-MT01-13 | 4h | CrewAI setup |
| E: LLM-Based | US-MT28-35 | 8h | Pydantic schemas |

**Total: ~47 hours**

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md) | Authoritative tool specs |
| [tool-mapping.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-mapping.md) | Agent-to-tool matrix |
| [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) | Target agent definitions |
| [asset-templates.md](./asset-templates.md) | US-AT01-AT10 (Blueprint Pattern) |

---

**Last Updated**: 2026-01-26
