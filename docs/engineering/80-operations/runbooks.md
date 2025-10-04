# Operations Runbooks

## General Operations

- **Incident**: Triage, scope, rollback, and communicate; postmortems required.
- **Replay**: DLQ replay with safety checks; correlation IDs required for traceability.
- **Cost Spike**: Engage breakers, reduce concurrency, switch to cheaper providers via policy router.

## CrewAI Backend Troubleshooting

### Evidence Store Tool Failures

**Symptoms:**
- Pydantic validation error: `Field required [type=missing, input_value={...}]`
- Agent retries 2-3 times before succeeding
- Initial failure rate ~20-30%

**Root Cause:**
Pydantic schema generation treats `Optional[str] = None` as required field in tool schemas.

**Solution:**
Use `str = ""` instead of `Optional[str] = None` for optional parameters:

```python
# ❌ WRONG - Pydantic sees this as required
def _run(
    self,
    action: str,
    evidence_id: Optional[str] = None
) -> str:
    pass

# ✅ CORRECT - Pydantic sees this as optional with default
def _run(
    self,
    action: str,
    evidence_id: str = ""
) -> str:
    pass
```

**Verification:**
```bash
cd backend
source crewai-env/bin/activate
python -c "
from src.startupai.tools import EvidenceStoreTool
tool = EvidenceStoreTool()
result = tool._run(action='store', project_id='test', evidence_data={'test': 'data'})
assert 'success' in result
print('✅ Evidence Store working')
"
```

### Template Variable Errors

**Symptoms:**
- `KeyError: "Template variable 'evidence_collection_output' not found"`
- Tasks fail during crew initialization

**Root Cause:**
Task descriptions referencing outputs from previous tasks using template variables like `{evidence_collection_output}`.

**Solution:**
Remove explicit template variable references from task descriptions. CrewAI automatically passes context between tasks in sequential process:

```yaml
# ❌ WRONG - Don't reference outputs explicitly
description: |
  Analyze the evidence: {evidence_collection_output}

# ✅ CORRECT - Use natural language
description: |
  Analyze the evidence collected in the previous task.
```

**Verification:**
```bash
python src/startupai/main.py --question "Test" --project-id "test-123"
# Should not throw KeyError
```

### Hierarchical Process Color Code Error

**Symptoms:**
- `KeyError: 'orange'` during crew execution
- Crew fails immediately after initialization

**Root Cause:**
CrewAI's hierarchical process has a bug with color codes in manager agent logging.

**Solution:**
Use sequential process instead:

```python
# ❌ WRONG - Has color code bug
crew = Crew(
    agents=[...],
    tasks=[...],
    process=Process.hierarchical,
    manager_agent=self.orchestration_agent()
)

# ✅ CORRECT - No color code issues
crew = Crew(
    agents=[...],
    tasks=[...],
    process=Process.sequential
)
```
