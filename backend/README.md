# StartupAI CrewAI Backend

Evidence-Led Strategy Platform - 6-Agent Business Analysis System

---

## 📖 Documentation

**→ All documentation is in [`CREW_AI.md`](./CREW_AI.md) ←**

Complete implementation guide with:
- Quick start & installation
- Full configuration files (agents.yaml, tasks.yaml)
- Complete Python implementation code
- Step-by-step implementation checklist
- Critical notes & common mistakes
- Verification commands

---

## Quick Start

```bash
cd backend
python3 -m venv crewai-env
source crewai-env/bin/activate
pip install crewai[tools]
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

**→ Then follow [`CREW_AI.md`](./CREW_AI.md) for complete implementation**

---

## Architecture

**6-Agent Sequential Crew (v1.0):**
1. Onboarding Agent → Entrepreneur Brief
2. Customer Researcher → Customer Profile  
3. Competitor Analyst → Positioning Map
4. Value Designer → Value Proposition Canvas
5. Validation Agent → Validation Roadmap
6. QA Agent → Quality Audit & Final Deliverables

**Built on:** Osterwalder's Value Proposition Design, Business Model Generation, Testing Business Ideas

---

## Repository Structure

```
backend/
├── CREW_AI.md              # 📖 Complete implementation guide (READ THIS)
├── README.md               # This file
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies (ready for v1.0)
├── netlify/               # Netlify Functions deployment
│   └── functions/
│       └── crewai-analyze.py
└── crewai-env/            # Virtual environment (git ignored)
```

**After implementation:**
```
backend/
└── src/
    └── startupai/
        ├── __init__.py
        ├── crew.py         # Main crew orchestration
        ├── main.py         # Execution entry point
        └── config/
            ├── agents.yaml # Agent definitions
            └── tasks.yaml  # Task definitions
```

---

## Current Status

**Implementation Phase:** Planning Complete ✅  
**Next Step:** Create YAML configs and Python implementation per [`CREW_AI.md`](./CREW_AI.md)

### Legacy Files (Pre-Migration)
- `netlify/functions/crewai-analyze.py` - Old serverless function (will be updated for new structure)

### What's Changing
- **Old:** Hardcoded agents in Python
- **New:** YAML-configured agents (maintainable, scalable)
- **Process:** v1.0 Sequential → v1.1 Concurrent (planned)

---

## Contributing

1. Read [`CREW_AI.md`](./CREW_AI.md) for implementation details
2. Follow the implementation checklist
3. Test thoroughly (5+ successful runs required)
4. Update tests and documentation
5. Submit PR

---

## Support

**Issues:** [GitHub Issues](https://github.com/chris00walker/app.startupai.site/issues)  
**Documentation:** [`CREW_AI.md`](./CREW_AI.md)  
**Contact:** Chris Walker

---

## License

MIT License - See LICENSE file for details
