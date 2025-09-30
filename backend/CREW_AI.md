# 🚀 Deep-Optimized CrewAI Implementation for StartupAI

**Single Source of Truth for StartupAI CrewAI Backend**

**Status:** ✅ Verified Against Official CrewAI Documentation  
**Date:** September 30, 2025  
**Version:** 1.0 (Sequential Process)

---

## Quick Start

### Prerequisites
- Python 3.10+
- Virtual environment
- OpenAI API key

### Installation
```bash
cd backend
python3 -m venv crewai-env
source crewai-env/bin/activate
pip install crewai[tools]
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

### Create Project Structure
```bash
mkdir -p src/startupai/config
touch src/startupai/__init__.py
# Create files as specified in sections below
```

### Run
```bash
cd src/startupai
python main.py
```

---

## 1. Core Principles

**Depth over speed** → Every agent produces rich, multi-layered outputs, aligned with Osterwalder's frameworks.

**Evidence orientation** → Deliverables are not just descriptive but anchored in research & validation.

**Cross-agent rigor** → Each output must explicitly reference inputs from prior agents to avoid "free-floating AI."

**Final deliverables = 3 layers:**
- **Structured Data (JSON/YAML)** → for dashboards & analytics
- **Narrative Reports (Markdown/PDF)** → for entrepreneurs  
- **QA Report (YAML)** → internal traceability & quality checks

---

## 2. Project Structure

```
app.startupai.site/
├── backend/
│   ├── config/
│   │   ├── agents.yaml      # Agent definitions
│   │   └── tasks.yaml       # Task definitions
│   ├── src/
│   │   └── startupai/
│   │       ├── crew.py      # Main crew orchestration
│   │       └── main.py      # Execution entry point
│   └── requirements.txt     # Python dependencies
```

---

## 3. Configuration Files

### 🗂️ `config/agents.yaml`

```yaml
onboarding_agent:
  role: >
    Entrepreneur Onboarding Consultant
  goal: >
    Guide founders through a structured conversation to collect all inputs
    needed for startup validation and design.
  backstory: >
    You are a patient and inquisitive consultant who knows how to ask the right
    questions. Your job is to create a structured Entrepreneur Brief that
    captures vision, constraints, and resources.

customer_researcher:
  role: >
    Customer Insight Researcher
  goal: >
    Identify detailed customer Jobs-to-be-Done, Pains, and Gains that form
    the foundation for value proposition design.
  backstory: >
    You are a market researcher skilled at extracting insights from secondary
    data and framing them clearly. You think in terms of Jobs, Pains, and Gains,
    and connect them directly to real market evidence.

competitor_analyst:
  role: >
    Competitive Strategy Analyst
  goal: >
    Map the competitive landscape and identify differentiation opportunities
    for the entrepreneur.
  backstory: >
    You are an analytical strategist who thrives on understanding business
    models and positioning. You benchmark competitors systematically using
    Business Model Canvas principles.

value_designer:
  role: >
    Value Proposition Designer
  goal: >
    Create a Value Proposition Canvas and craft a concise Value Proposition
    Statement that connects customer pains and gains to the entrepreneur's
    solution.
  backstory: >
    You are a structured but creative strategist. You synthesize customer
    insights and competitive mapping into clear, testable value propositions.

validation_agent:
  role: >
    Startup Validation Strategist
  goal: >
    Design a three-tier Validation Roadmap with weak, medium, and strong
    evidence tests linked to assumptions in the Entrepreneur Brief.
  backstory: >
    You are a practical experimentalist who believes in testing, not guessing.
    You design lean experiments mapped to assumptions and tailored to budget
    and channels.

qa_agent:
  role: >
    Startup QA Auditor
  goal: >
    Ensure all deliverables are consistent, high-quality, and aligned with
    startup frameworks before delivery to the entrepreneur.
  backstory: >
    You are a perfectionist auditor who applies Value Proposition Design,
    Business Model Generation, and Testing Business Ideas as your standard.
    You catch weak spots and make corrections before clients ever see the work.
```

---

### 🗂️ `config/tasks.yaml`

```yaml
onboarding_task:
  description: >
    Conduct a guided conversation with the entrepreneur to capture all
    relevant inputs for validation and design. Ask about customer segments,
    problems/opportunities, product/solution ideas, known competitors, budget,
    validation channels, available assets, and stage of business.
  expected_output: >
    A structured Entrepreneur Brief in JSON format plus a narrative summary
    in Markdown. The brief must include: customer segments, problems,
    opportunities, solution idea, competitors, budget, channels, assets,
    and business stage.

customer_research_task:
  description: >
    Using the Entrepreneur Brief, research the customer perspective.
    Identify functional, emotional, and social jobs. Document pains
    (risks, barriers, frustrations) and gains (benefits, outcomes).
    Include citations to evidence sources.
  expected_output: >
    A Customer Profile in JSON with jobs, pains, and gains. Also produce
    a narrative Markdown summary highlighting the top 3 pains and why
    they matter.

competitor_analysis_task:
  description: >
    Analyze the competitive landscape using the Entrepreneur Brief.
    Select 2-3 axes to map the market and position the entrepreneur's
    solution. Provide competitor profiles benchmarked against Business
    Model Canvas blocks.
  expected_output: >
    A Positioning Map in JSON, competitor profiles, and a narrative Markdown
    summary explaining where the founder's idea fits and how it differentiates.

value_design_task:
  description: >
    Synthesize the Customer Profile and Competitor Insights into a clear
    Value Proposition. Map pains to pain relievers and gains to gain
    creators. Write a concise, testable Value Proposition Statement.
  expected_output: >
    A Value Proposition Canvas in JSON plus a Value Proposition Statement
    in plain text. Include a Markdown summary explaining how the solution
    addresses pains and creates gains.

validation_task:
  description: >
    Based on the Entrepreneur Brief and Value Proposition, design a
    three-tier Validation Roadmap. Include weak, medium, and strong tests,
    each linked to specific assumptions. Tailor tests to the founder's
    budget, channels, and assets.
  expected_output: >
    A Validation Roadmap in JSON containing at least one weak test,
    one medium test, and one strong test. Also include an Evidence Ledger
    mapping each test to assumptions, and a Markdown summary explaining
    test priorities and success metrics.

qa_task:
  description: >
    Audit all deliverables for completeness, clarity, and alignment
    with frameworks (Value Proposition Design, Testing Business Ideas,
    Business Model Generation). Check that each pain has a mapped reliever
    and each gain has a mapped creator. Ensure the Value Proposition
    Statement is concise and testable.
  expected_output: >
    A QA Report in YAML (pass/fail per deliverable, corrections, and
    satisfaction likelihood score) plus corrected deliverables in Markdown.
```

**Note:** Agent assignments are handled in `crew.py` via `agent=self.agent_name()` parameters, not in YAML.

---

## 4. Implementation Code

### 🐍 `src/startupai/crew.py`

```python
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class StartupAICrew:
    """StartupAI: Crew of 6 Agents for Value Proposition Design & Validation"""
    
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    # === Agents ===
    @agent
    def onboarding_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['onboarding_agent'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def customer_researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['customer_researcher'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def competitor_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['competitor_analyst'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def value_designer(self) -> Agent:
        return Agent(
            config=self.agents_config['value_designer'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def validation_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['validation_agent'],
            allow_delegation=False,
            verbose=True
        )

    @agent
    def qa_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['qa_agent'],
            allow_delegation=True,  # QA can delegate to other agents for verification
            verbose=True
        )

    # === Tasks ===
    @task
    def onboarding_task(self) -> Task:
        return Task(
            config=self.tasks_config['onboarding_task'],
            agent=self.onboarding_agent()
        )

    @task
    def customer_research_task(self) -> Task:
        return Task(
            config=self.tasks_config['customer_research_task'],
            agent=self.customer_researcher()
        )

    @task
    def competitor_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['competitor_analysis_task'],
            agent=self.competitor_analyst()
        )

    @task
    def value_design_task(self) -> Task:
        return Task(
            config=self.tasks_config['value_design_task'],
            agent=self.value_designer()
        )

    @task
    def validation_task(self) -> Task:
        return Task(
            config=self.tasks_config['validation_task'],
            agent=self.validation_agent()
        )

    @task
    def qa_task(self) -> Task:
        return Task(
            config=self.tasks_config['qa_task'],
            agent=self.qa_agent()
        )

    # === Crew Assembly ===
    @crew
    def crew(self) -> Crew:
        """
        Creates the StartupAI Crew
        
        Sequential process (v1.0):
        1. Onboarding Agent → Entrepreneur Brief
        2. Customer Researcher → Customer Profile
        3. Competitor Analyst → Positioning Map
        4. Value Designer → Value Proposition Canvas
        5. Validation Agent → Validation Roadmap
        6. QA Agent → Quality Audit & Final Deliverables
        """
        return Crew(
            agents=self.agents,  # Auto-populated by @agent decorator
            tasks=self.tasks,    # Auto-populated by @task decorator
            process=Process.sequential,
            verbose=True
        )
```

---

### ⚙️ `src/startupai/main.py`

```python
from src.startupai.crew import StartupAICrew

if __name__ == "__main__":
    crew = StartupAICrew().crew()

    # Inputs passed in when entrepreneur begins onboarding
    inputs = {
        "entrepreneur_name": "Chris",
        "product_idea": "authentic Mediterranean imports",
        "customer_segment": "specialty food retailers and chefs",
        "budget": "2000 USD for validation ads",
        "channels": ["LinkedIn", "Trade Shows"],
        "stage": "early idea"
    }

    result = crew.kickoff(inputs=inputs)
    print("\n=== Final Deliverables ===\n")
    print(result)
```

---

## 5. Agent Composition & Flow

### **6-Agent Crew System**

1. **🧑‍💼 Onboarding Agent** - Entrepreneur Onboarding Consultant
   - Structures and clarifies business input
   - Creates Entrepreneur Brief (JSON + Markdown)
   - Framework: Business Model Canvas

2. **🔎 Customer Researcher** - Customer Insight Researcher  
   - Identifies Jobs, Pains, Gains
   - Produces Customer Profile with evidence citations
   - Framework: Value Proposition Design (2014)

3. **📊 Competitor Analyst** - Competitive Strategy Analyst
   - Maps competitive landscape
   - Creates Positioning Map and competitor profiles
   - Framework: Business Model Generation (2010)

4. **🎨 Value Designer** - Value Proposition Designer
   - Synthesizes customer insights and competitive analysis
   - Creates Value Proposition Canvas + Statement
   - Framework: Value Proposition Design (2014)

5. **✅ Validation Agent** - Startup Validation Strategist
   - Designs three-tier validation roadmap
   - Maps weak/medium/strong tests to assumptions
   - Framework: Testing Business Ideas (2019)

6. **🛡️ QA Agent** - Startup QA Auditor
   - Audits all deliverables for quality & framework alignment
   - Produces QA Report and corrected deliverables
   - Framework: VPD + TBIs + BMG cross-reference

---

### **Sequential + Parallel Flow**

```
1. Onboarding Agent → Entrepreneur Brief
                    ↓
2. ┌─────────────────────────────────────┐
   │ Customer Researcher (parallel)      │
   │ Competitor Analyst (parallel)       │
   └─────────────────────────────────────┘
                    ↓
3. Value Designer → Value Proposition Canvas
                    ↓
4. Validation Agent → Validation Roadmap
                    ↓
5. QA Agent → Quality Audit & Final Deliverables
```

---

## 6. Final Deliverables (Depth-Oriented)

Each engagement produces **three layers** of deliverables:

### **Layer 1: Structured Data (JSON/YAML)**
- Entrepreneur Brief
- Customer Profile (Jobs/Pains/Gains)
- Positioning Map
- Value Proposition Canvas
- Validation Roadmap (Weak/Medium/Strong tests)
- QA Report

### **Layer 2: Narrative Reports (Markdown/PDF)**
- Executive summary for founders
- Customer insights narrative
- Competitive positioning analysis
- Value proposition explanation
- Validation test recommendations

### **Layer 3: QA Notes (YAML)**
- Internal traceability
- Framework compliance checks
- Quality scores
- Correction notes

---

## 7. Optional: Tools Integration

For real-world data gathering, integrate search tools:

```python
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

# In crew.py, add tools to agents:
@agent
def customer_researcher(self):
    agent = self.agents_config['customer_researcher']
    agent.tools = [search_tool]
    return agent

@agent
def competitor_analyst(self):
    agent = self.agents_config['competitor_analyst']
    agent.tools = [search_tool]
    return agent
```

---

## 8. Key Implementation Notes

### **Parallel Execution**
- CrewAI doesn't natively mark tasks as parallel in YAML
- Manage by running Customer Research + Competitor Analysis in a `Process.concurrent` sub-crew
- Feed both outputs into Value Designer sequentially

### **Output Persistence**
- Add `output_file` keys to tasks.yaml for persistent storage
- Example: `output_file: "entrepreneur_brief.json"`

### **Environment Variables**
```bash
OPENAI_API_KEY=your-openai-key
SERPER_API_KEY=your-serper-key  # Optional for web search
```

### **Process Options**
```python
process=Process.sequential    # Default, tasks run in order
process=Process.hierarchical  # Manager agent coordinates
process=Process.concurrent    # Tasks run in parallel where possible
```

---

## 9. Why This Matters

✅ **Entrepreneurs get deep, structured insight, not just templates**

✅ **Deliverables are investor-legible** (aligned with Osterwalder frameworks)

✅ **The process ensures problem-solution fit + validation roadmap**

✅ **QA layer guarantees consistent, high-quality outputs**

✅ **YAML configs make the system maintainable and extensible**

✅ **Depth-first approach mirrors world-class incubators (Y Combinator, Strategyzer)**

---

## ✅ Conclusion

This **depth-first CrewAI implementation** transforms StartupAI into a **structured startup design pipeline** that combines:
- **Framework rigor** (Osterwalder's VPD, BMG, TBIs)
- **Evidence-based validation** (weak/medium/strong tests)
- **Quality assurance** (automated auditing)
- **Scalable AI orchestration** (CrewAI multi-agent system)

The result: A system that doesn't just automate—it **systematizes world-class startup coaching at scale**.

---

## 🎯 Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create virtual environment: `python3 -m venv crewai-env`
- [ ] Install dependencies: `pip install crewai[tools]`
- [ ] Create directory structure: `mkdir -p src/startupai/config`
- [ ] Copy `.env.example` to `.env` and add OPENAI_API_KEY
- [ ] Create `src/startupai/__init__.py`

### Phase 2: Configuration (Day 1-2)
- [ ] Create `config/agents.yaml` (copy from Section 3)
- [ ] Create `config/tasks.yaml` (copy from Section 3)
- [ ] Verify YAML syntax with `python -c "import yaml; yaml.safe_load(open('config/agents.yaml'))"`

### Phase 3: Implementation (Day 2-3)
- [ ] Create `src/startupai/crew.py` (copy from Section 4)
- [ ] Create `src/startupai/main.py` (copy from Section 4)
- [ ] Test imports: `python -c "from src.startupai.crew import StartupAICrew"`

### Phase 4: Validation (Day 3)
- [ ] Run first test: `cd src/startupai && python main.py`
- [ ] Verify all 6 agents initialize
- [ ] Check task execution order
- [ ] Review output structure
- [ ] Test with different business inputs
- [ ] Create test suite (pytest) for regression testing

### Phase 5: Integration (Week 1)
- [ ] Create FastAPI wrapper (optional)
- [ ] Add Supabase persistence (optional)
- [ ] Deploy to Netlify Functions (optional)

### Success Criteria
- ✅ All agents load from YAML configs
- ✅ Tasks execute in sequential order
- ✅ Output includes all 3 layers (JSON, Markdown, YAML)
- ✅ QA agent validates framework alignment
- ✅ 5+ successful runs with different inputs

---

## 🚨 Critical Implementation Notes

### ⚠️ Common Mistakes to Avoid

1. **Config Path Strings**
   - ✅ DO: `agents_config = 'config/agents.yaml'` (string class attribute)
   - ❌ DON'T: Load and store as dict in `__init__`

2. **Agent/Task Returns**
   - ✅ DO: Return `Agent(config=...)` and `Task(config=...)` objects
   - ❌ DON'T: Return raw dict from config

3. **Crew Assembly**
   - ✅ DO: Use `self.agents` and `self.tasks` (auto-populated)
   - ❌ DON'T: Manually list all agents/tasks in arrays

4. **Task Agent Assignment**
   - ✅ DO: Assign in Python: `agent=self.customer_researcher()`
   - ❌ DON'T: Add `agent:` field to tasks.yaml

5. **Type Hints**
   - ✅ DO: Add return types: `-> Agent`, `-> Task`, `-> Crew`
   - ❌ DON'T: Omit type hints

### 📋 Verification Commands

```bash
# Test YAML syntax
python -c "import yaml; print(yaml.safe_load(open('config/agents.yaml')))"

# Test imports
python -c "from src.startupai.crew import StartupAICrew; print('✅ Import successful')"

# Test agent initialization
python -c "from src.startupai.crew import StartupAICrew; crew = StartupAICrew(); print(f'Agents: {len(crew.agents)}')"

# Full test run
cd src/startupai && python main.py
```

---

## 📚 Reference Documentation

- **Official CrewAI Docs:** [docs.crewai.com](https://docs.crewai.com)
- **CrewAI GitHub:** [github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)
- **Official Examples:** [github.com/crewAIInc/crewAI-examples](https://github.com/crewAIInc/crewAI-examples)
- **Osterwalder's Frameworks:**
  - Value Proposition Design (2014)
  - Business Model Generation (2010)
  - Testing Business Ideas (2019)

---

## 🔄 Version History

### v1.0 - September 30, 2025
- ✅ Initial implementation with sequential process
- ✅ 6-agent crew (Onboarding, Customer, Competitor, Value, Validation, QA)
- ✅ YAML-based configuration
- ✅ Verified against official CrewAI patterns
- ✅ Framework-aligned output (VPD, BMG, TBIs)

### v1.1 - Planned (After 5+ Successful Runs)
- 🔜 Concurrent execution for Customer + Competitor agents
- 🔜 Real web search integration (SerperDevTool)
- 🔜 Supabase persistence
- 🔜 FastAPI production deployment

---

**This is the single source of truth for StartupAI's CrewAI backend implementation.**  
**All other planning documents have been archived.**
