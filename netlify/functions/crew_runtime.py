"""
Shared CrewAI runtime utilities for Netlify functions.

Provides conversation orchestration heuristics, structured analysis payload
generation, and environment loading helpers so both foreground and background
functions behave consistently.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv

# Attempt to import StartupAICrew (required for full analysis)
# The ConversationEngine works standalone without this dependency
try:
    import sys
    from pathlib import Path

    # Try local directory first (Netlify deployment - startupai module is in same directory)
    local_path = Path(__file__).parent
    if str(local_path) not in sys.path:
        sys.path.insert(0, str(local_path))

    # Try backend path for local development
    backend_src = Path(__file__).parent.parent.parent / "backend" / "src"
    if backend_src.exists() and str(backend_src) not in sys.path:
        sys.path.insert(0, str(backend_src))

    from startupai import StartupAICrew  # type: ignore
    print("[CREW_RUNTIME] StartupAICrew loaded successfully")
except Exception as crew_import_error:
    # This should only happen if dependencies are missing
    print(f"[CREW_RUNTIME ERROR] Failed to import StartupAICrew: {crew_import_error}")
    import traceback
    traceback.print_exc()
    StartupAICrew = None  # type: ignore

# =============================================================================
# Environment Loading
# =============================================================================

_ENV_LOADED = False


def ensure_environment_loaded() -> None:
    """Load environment variables from local development files once."""
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    search_paths = [
        Path(__file__).resolve().parents[2] / ".env.local",
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[1] / ".env.local",
        Path(__file__).resolve().parents[1] / ".env",
    ]

    for candidate in search_paths:
        if candidate.exists():
            load_dotenv(candidate, override=False)

    _ENV_LOADED = True


# =============================================================================
# Conversation Configuration
# =============================================================================

CONVERSATION_STAGES: Dict[int, Dict[str, Any]] = {
    1: {
        "name": "Welcome & Introduction",
        "description": "Getting to know you and your business idea",
        "key_questions": [
            "What business idea are you most excited about?",
            "What inspired this idea?",
            "What stage is your business currently in?",
        ],
        "data_to_collect": ["business_concept", "inspiration", "current_stage"],
        "progress_threshold": 80,
    },
    2: {
        "name": "Customer Discovery",
        "description": "Understanding your target customers",
        "key_questions": [
            "Who do you think would be most interested in this solution?",
            "What specific group of people have this problem most acutely?",
            "How do these customers currently solve this problem?",
        ],
        "data_to_collect": ["target_customers", "customer_segments", "current_solutions"],
        "progress_threshold": 75,
    },
    3: {
        "name": "Problem Definition",
        "description": "Defining the core problem you're solving",
        "key_questions": [
            "What specific problem does your solution address?",
            "How painful is this problem for your customers?",
            "How often do they encounter this problem?",
        ],
        "data_to_collect": ["problem_description", "pain_level", "frequency"],
        "progress_threshold": 80,
    },
    4: {
        "name": "Solution Validation",
        "description": "Exploring your proposed solution",
        "key_questions": [
            "How does your solution solve this problem?",
            "What makes your approach unique?",
            "What's your key differentiator?",
        ],
        "data_to_collect": ["solution_description", "unique_value_prop", "differentiation"],
        "progress_threshold": 75,
    },
    5: {
        "name": "Competitive Analysis",
        "description": "Understanding the competitive landscape",
        "key_questions": [
            "Who else is solving this problem?",
            "What alternatives do customers have?",
            "What would make customers switch to your solution?",
        ],
        "data_to_collect": ["competitors", "alternatives", "switching_barriers"],
        "progress_threshold": 70,
    },
    6: {
        "name": "Resources & Constraints",
        "description": "Assessing your available resources",
        "key_questions": [
            "What's your budget for getting started?",
            "What skills and resources do you have available?",
            "What are your main constraints?",
        ],
        "data_to_collect": ["budget_range", "available_resources", "constraints"],
        "progress_threshold": 75,
    },
    7: {
        "name": "Goals & Next Steps",
        "description": "Setting strategic goals and priorities",
        "key_questions": [
            "What do you want to achieve in the next 3 months?",
            "How will you measure success?",
            "What's your biggest priority right now?",
        ],
        "data_to_collect": ["short_term_goals", "success_metrics", "priorities"],
        "progress_threshold": 85,
    },
}

PLAN_PERSONALITIES = {
    "trial": {
        "name": "Alex",
        "role": "Strategic Consultant",
        "tone": "encouraging and supportive",
        "expertise": "early-stage validation",
    },
    "sprint": {
        "name": "Jordan",
        "role": "Business Strategist",
        "tone": "focused and analytical",
        "expertise": "rapid validation and testing",
    },
    "founder": {
        "name": "Morgan",
        "role": "Senior Strategy Advisor",
        "tone": "experienced and insightful",
        "expertise": "scaling and growth strategies",
    },
    "enterprise": {
        "name": "Taylor",
        "role": "Executive Consultant",
        "tone": "sophisticated and comprehensive",
        "expertise": "enterprise-level strategic planning",
    },
}

SPECIFICITY_PATTERN = re.compile(r"\b(specifically|exactly|particularly|mainly|primarily)\b", re.IGNORECASE)
BUDGET_PATTERN = re.compile(r"\$[\d,]+")
PAIN_WORDS = ["painful", "frustrating", "difficult", "expensive", "time-consuming", "annoying"]

CLARITY_SCORES = {"high": 0.92, "medium": 0.68, "low": 0.38}
COMPLETENESS_SCORES = {"complete": 1.0, "partial": 0.66, "insufficient": 0.35}


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


# =============================================================================
# Conversation Engine
# =============================================================================

class ConversationEngine:
    """Encapsulates conversation heuristics previously implemented in TypeScript."""

    def __init__(self) -> None:
        ensure_environment_loaded()

    def start_session(
        self,
        *,
        plan_type: str,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate the introductory prompt and context for a new onboarding session."""
        persona = PLAN_PERSONALITIES.get(plan_type, PLAN_PERSONALITIES["trial"])
        introduction = (
            f"Hi! I'm {persona['name']}, your {persona['role']}. "
            "I'm here to help you develop a comprehensive strategic analysis of your business idea. "
            "I'll guide you through a structured conversation to understand your vision, validate your assumptions, "
            "and create actionable insights."
        )
        first_question = (
            "Let's start with the big picture. What's the business idea or opportunity you're most excited about right now? "
            "Don't worry about having all the details figured out - I'm here to help you think through everything systematically."
        )

        stage_snapshot = self._build_stage_snapshot(
            stage_id=1,
            coverage=0.0,
            clarity_label="medium",
            completeness_label="partial",
            detail_score=0.05,
            brief_update={},
            raw_message=None,
        )

        expected_outcomes = [
            "Comprehensive entrepreneur brief",
            "Strategic recommendations",
            "Validation plan with specific next steps",
            "Business model canvas",
            "Competitive analysis",
            "Resource allocation strategy",
        ]

        context = {
            "agentPersonality": persona,
            "expectedOutcomes": expected_outcomes,
            "privacyNotice": (
                "Your conversation is private and secure. All information shared will be used solely to provide personalized "
                "strategic guidance and will not be shared with third parties."
            ),
        }

        stage_state = {
            "current_stage": 1,
            "stage_name": CONVERSATION_STAGES[1]["name"],
            "total_stages": len(CONVERSATION_STAGES),
            "stage_progress": 0,
            "overall_progress": 0,
            "summary": CONVERSATION_STAGES[1]["description"],
        }

        quality_signals = {
            "clarity": {"label": "medium", "score": CLARITY_SCORES["medium"]},
            "completeness": {"label": "partial", "score": COMPLETENESS_SCORES["partial"]},
            "detail_score": 0.05,
            "overall": round((CLARITY_SCORES["medium"] + COMPLETENESS_SCORES["partial"] + 0.05) / 3, 2),
            "encouragement": "Let's explore your vision together and capture the details that matter.",
            "quality_tags": ["needs_detail"],
        }

        return {
            "introduction": introduction,
            "first_question": first_question,
            "context": context,
            "stage_state": stage_state,
            "stage_snapshot": stage_snapshot,
            "quality_signals": quality_signals,
            "estimated_duration": "20-25 minutes",
            "user_context": user_context or {},
        }

    def process_message(
        self,
        *,
        session_id: str,
        message: str,
        current_stage: int,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        stage_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process a single user message and derive stage progression + quality."""
        stage_id = current_stage if current_stage in CONVERSATION_STAGES else 1
        stage_config = CONVERSATION_STAGES[stage_id]
        history = conversation_history or []
        stage_state = stage_data or {}

        message_clean = (message or "").strip()
        message_lower = message_clean.lower()
        has_details = len(message_clean) > 50
        has_specifics = bool(SPECIFICITY_PATTERN.search(message_clean))

        stage_progress = len(history) * 15
        stage_progress += 20 if has_details else 10
        if has_specifics:
            stage_progress += 15
        stage_progress = min(100, stage_progress)

        overall_progress = min(100.0, ((stage_id - 1) * 14) + (stage_progress * 0.14))
        is_stage_complete = stage_progress >= stage_config["progress_threshold"]
        next_stage = stage_id + 1 if is_stage_complete and stage_id < len(CONVERSATION_STAGES) else stage_id

        # Stage-specific agent response logic (ported from frontend implementation)
        brief_update: Dict[str, Any] = {}
        agent_response = ""
        follow_up_question = ""

        if stage_id == 1:
            if "app" in message_lower or "software" in message_lower:
                agent_response = "A software solution - that's exciting! The digital space offers incredible opportunities for scalability and impact. "
                brief_update["business_stage"] = "idea"
                brief_update["solution_type"] = "software"
            elif "service" in message_lower or "consulting" in message_lower:
                agent_response = "A service-based business can be a great way to start with lower upfront costs and direct customer feedback. "
                brief_update["business_stage"] = "idea"
                brief_update["solution_type"] = "service"
            else:
                agent_response = "Thank you for sharing that with me! I can hear the passion in your description. "

            if is_stage_complete:
                agent_response += "Now that I understand your core concept, let's dive deeper into who this would serve. "
                follow_up_question = (
                    "Who do you envision as your ideal customer? Think about the specific type of person or business that would "
                    "get the most value from what you're creating."
                )
            else:
                follow_up_question = (
                    "Can you tell me more about what inspired this idea? What problem or opportunity did you notice that led you here?"
                )

        elif stage_id == 2:
            if "business" in message_lower or "company" in message_lower:
                agent_response = "B2B customers can be fantastic - they often have bigger budgets and longer-term relationships. "
                brief_update["customer_type"] = "b2b"
            elif "people" in message_lower or "individual" in message_lower:
                agent_response = "Consumer markets offer great opportunities for scale and direct impact. "
                brief_update["customer_type"] = "b2c"
            else:
                agent_response = ""

            agent_response += "Understanding your customers deeply is crucial for success. "

            if is_stage_complete:
                follow_up_question = (
                    "Perfect! Now let's get specific about the problem you're solving. What exact pain point or challenge do these customers face "
                    "that your solution addresses?"
                )
            else:
                follow_up_question = (
                    "Can you be more specific about this customer segment? What characteristics do they share? What's their situation that makes them need your solution?"
                )

        elif stage_id == 3:
            has_pain_language = any(word in message_lower for word in PAIN_WORDS)
            if has_pain_language:
                agent_response = "I can tell this is a real pain point - that emotional language tells me customers would be motivated to find a solution. "
                brief_update["problem_pain_level"] = 8
            else:
                agent_response = "Thanks for explaining that. Understanding the problem clearly is essential for building the right solution. "
                brief_update["problem_pain_level"] = 6

            brief_update["problem_description"] = message_clean[:500]

            if is_stage_complete:
                follow_up_question = (
                    "Excellent! Now I'd love to understand your solution. How exactly do you plan to solve this problem? What's your approach?"
                )
            else:
                follow_up_question = (
                    "Help me understand the impact of this problem. How often do your customers encounter it, and what does it cost them when they do?"
                )

        elif stage_id == 4:
            brief_update["solution_description"] = message_clean[:500]

            if "unique" in message_lower or "different" in message_lower:
                agent_response = "I love that you're thinking about differentiation! That's what will make customers choose you over alternatives. "
            else:
                agent_response = "That's a solid approach to solving the problem. "

            if is_stage_complete:
                follow_up_question = (
                    "Great solution! Now let's look at the competitive landscape. Who else is trying to solve this problem, and how are customers handling it today?"
                )
            else:
                follow_up_question = (
                    "What makes your solution unique? Why would customers choose your approach over other ways of solving this problem?"
                )

        elif stage_id == 5:
            agent_response = "Understanding the competition helps you position yourself effectively and identify opportunities. "

            if "no competition" in message_lower or "no one else" in message_lower:
                agent_response += (
                    "While it might seem like there's no direct competition, customers are always solving this problem somehow - "
                    "even if it's manual processes or workarounds. "
                )

            if is_stage_complete:
                follow_up_question = (
                    "Perfect! Now let's talk resources. What's your budget range for getting this business started, and what skills or assets do you already have?"
                )
            else:
                follow_up_question = (
                    "What would convince a customer to switch from their current solution to yours? What's the compelling reason to change?"
                )

        elif stage_id == 6:
            budget_match = BUDGET_PATTERN.search(message_clean)
            if budget_match or "thousand" in message_lower or "budget" in message_lower:
                agent_response = "Having a clear budget helps with planning and prioritization. "
                brief_update["budget_range"] = budget_match.group(0) if budget_match else "specified"
            else:
                agent_response = ""

            agent_response += "Understanding your resources helps us create a realistic roadmap. "

            if is_stage_complete:
                follow_up_question = (
                    "Excellent! For our final topic, let's set some strategic goals. What do you want to achieve with this business in the next 3 months?"
                )
            else:
                follow_up_question = (
                    "What skills, connections, or assets do you already have that could help with this business? "
                    "And what are your biggest constraints or limitations?"
                )

        elif stage_id == 7:
            agent_response = "Setting clear, measurable goals is crucial for making progress and staying motivated. "
            brief_update["three_month_goals"] = [message_clean[:200]]

            if is_stage_complete:
                agent_response += (
                    "Fantastic! We've covered all the key areas. I have everything I need to create your comprehensive strategic analysis. "
                )
                follow_up_question = (
                    "Before I generate your personalized strategic report, is there anything else about your business idea that you think is important for me to know?"
                )
            else:
                follow_up_question = (
                    "How will you measure success? What specific metrics or milestones will tell you that you're making progress?"
                )

        clarity_label = "high" if has_details and has_specifics else ("medium" if has_details else "low")
        completeness_label = (
            "complete"
            if is_stage_complete
            else ("partial" if stage_progress > 50 else "insufficient")
        )

        suggestions: List[str] = []
        if not has_details:
            suggestions.append("Try to provide more specific details to help me understand your situation better.")
        if stage_progress < 50:
            suggestions.append("Consider sharing examples or specific scenarios to illustrate your points.")

        quality_tags = []
        if clarity_label == "low":
            quality_tags.append("clarity_low")
        if completeness_label == "insufficient":
            quality_tags.append("incomplete")

        detail_score = round(stage_progress / 100, 2)
        quality_signals = {
            "clarity": {"label": clarity_label, "score": CLARITY_SCORES[clarity_label]},
            "completeness": {"label": completeness_label, "score": COMPLETENESS_SCORES[completeness_label]},
            "detail_score": detail_score,
            "overall": round(
                (CLARITY_SCORES[clarity_label] + COMPLETENESS_SCORES[completeness_label] + detail_score) / 3,
                2,
            ),
            "suggestions": suggestions,
            "encouragement": "You're making great progress! Your insights are helping build a comprehensive picture of your business opportunity.",
            "quality_tags": quality_tags,
        }

        stage_snapshot = self._build_stage_snapshot(
            stage_id=stage_id,
            coverage=detail_score,
            clarity_label=clarity_label,
            completeness_label=completeness_label,
            detail_score=detail_score,
            brief_update=brief_update,
            raw_message=message_clean,
        )

        stage_state_payload = {
            "previous_stage": stage_id,
            "current_stage": next_stage,
            "stage_name": stage_config["name"],
            "next_stage_name": (
                CONVERSATION_STAGES[next_stage]["name"] if next_stage > stage_id else stage_config["name"]
            ),
            "stage_progress": 0 if next_stage > stage_id else stage_progress,
            "overall_progress": overall_progress,
            "is_stage_complete": is_stage_complete,
            "total_stages": len(CONVERSATION_STAGES),
        }

        system_actions = {
            "trigger_workflow": stage_id == 7 and is_stage_complete,
            "save_checkpoint": is_stage_complete,
            "request_clarification": stage_progress < 30 or clarity_label == "low",
            "needs_review": clarity_label == "low" or completeness_label == "insufficient",
        }

        conversation_metrics = {
            "stage_progress": stage_progress if next_stage == stage_id else 0,
            "overall_progress": overall_progress,
            "clarity_label": clarity_label,
            "completeness_label": completeness_label,
        }

        return {
            "agent_response": agent_response,
            "follow_up_question": "" if (is_stage_complete and next_stage > stage_id) else follow_up_question,
            "brief_update": brief_update,
            "quality_signals": quality_signals,
            "stage_state": stage_state_payload,
            "stage_snapshot": stage_snapshot,
            "system_actions": system_actions,
            "conversation_metrics": conversation_metrics,
        }

    def _build_stage_snapshot(
        self,
        *,
        stage_id: int,
        coverage: float,
        clarity_label: str,
        completeness_label: str,
        detail_score: float,
        brief_update: Dict[str, Any],
        raw_message: Optional[str],
    ) -> Dict[str, Any]:
        now_iso = datetime.utcnow().isoformat()
        return {
            "stage": stage_id,
            "coverage": _clamp(coverage, 0.0, 1.0),
            "quality": {
                "clarity": {"label": clarity_label, "score": CLARITY_SCORES[clarity_label]},
                "completeness": {"label": completeness_label, "score": COMPLETENESS_SCORES[completeness_label]},
                "detail_score": detail_score,
            },
            "brief_fields": sorted(brief_update.keys()),
            "last_message_excerpt": (raw_message or "")[:240],
            "updated_at": now_iso,
            "notes": (
                "Stage advanced" if completeness_label == "complete" else "Additional detail captured"
            ),
        }


# =============================================================================
# Structured Analysis Helpers
# =============================================================================

def normalize_result_payload(result: Any) -> str:
    """Convert a CrewAI result object into a serialisable string."""
    if result is None:
        return ""

    if isinstance(result, str):
        return result

    if hasattr(result, "raw"):
        raw_val = getattr(result, "raw")
        if isinstance(raw_val, str):
            return raw_val

    if hasattr(result, "output"):
        output_val = getattr(result, "output")
        if isinstance(output_val, str):
            return output_val

    try:
        return json.dumps(result, ensure_ascii=False, indent=2)
    except TypeError:
        return str(result)


def extract_sentences(text: str, max_sentences: int = 3) -> str:
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    selected = [s.strip() for s in sentences if s.strip()]
    return " ".join(selected[:max_sentences])


def extract_bullets(text: str, limit: int = 6) -> List[str]:
    bullets: List[str] = []
    for line in (text or "").splitlines():
        cleaned = line.strip(" •\t")
        if not cleaned:
            continue
        if cleaned.startswith(("-", "*")):
            bullets.append(cleaned.lstrip("-* ").strip())
        else:
            match = re.match(r"^\d+[\).\s-]+(.+)$", cleaned)
            if match:
                bullets.append(match.group(1).strip())
        if len(bullets) >= limit:
            break
    return [b for b in bullets if b]


def build_structured_payload(
    *,
    raw_text: str,
    inputs: Dict[str, Any],
    user_id: str,
    analysis_id: str,
) -> Dict[str, Any]:
    """Construct the structured analysis contract expected by the frontend."""
    summary = extract_sentences(raw_text, max_sentences=3)
    bullets = extract_bullets(raw_text, limit=6)

    if not summary and raw_text:
        summary = raw_text[:350]
    if not bullets and summary:
        bullets = [summary]

    insight_summaries = [
        {
            "id": str(uuid.uuid4()),
            "headline": bullet,
            "confidence": "medium",
            "support": "Derived from CrewAI synthesis",
        }
        for bullet in bullets
    ]

    evidence_items = [
        {
            "id": str(uuid.uuid4()),
            "title": bullet[:90],
            "content": bullet,
            "source": "CrewAI synthesis",
            "strength": "medium",
            "tags": ["ai_generated", "crew_analysis"],
        }
        for bullet in bullets[:3]
    ]

    report_payload = {
        "title": f"Strategic Analysis – {inputs.get('strategic_question', 'Strategic Focus')}",
        "report_type": "recommendation",
        "content": raw_text or summary,
        "model": "crewai",
        "generated_at": datetime.utcnow().isoformat(),
    }

    brief_payload = {
        "problem_description": summary,
        "solution_description": inputs.get("strategic_question"),
        "unique_value_proposition": bullets[0] if bullets else summary,
        "differentiation_factors": bullets[:3],
        "business_stage": "validation",
        "recommended_next_steps": bullets[:3],
        "ai_confidence_scores": {"analysis": 0.6},
        "validation_flags": [],
    }

    evidence_strength = 0.55 + min(len(evidence_items) * 0.1, 0.35)
    insight_depth = 0.6 + min(len(insight_summaries) * 0.05, 0.3)
    quality_overall = round((evidence_strength + insight_depth) / 2, 2)

    quality_signals = {
        "analysis_confidence": round(quality_overall, 2),
        "evidence_strength": round(evidence_strength, 2),
        "insight_depth": round(insight_depth, 2),
        "quality_tags": [
            tag
            for tag, condition in [
                ("needs_more_evidence", evidence_strength < 0.6),
                ("high_value_insights", insight_depth >= 0.75),
            ]
            if condition
        ],
    }

    stage_metrics = [
        {
            "stage": "Entrepreneur Brief",
            "coverage": 0.85,
            "quality": quality_overall,
        },
        {
            "stage": "Customer Insights",
            "coverage": 0.78,
            "quality": round(min(0.82, quality_overall + 0.04), 2),
        },
        {
            "stage": "Validation Roadmap",
            "coverage": 0.72,
            "quality": round(min(0.8, quality_overall + 0.02), 2),
        },
    ]

    return {
        "analysis_id": analysis_id,
        "run_started_at": datetime.utcnow().isoformat(),
        "summary": summary,
        "insight_summaries": insight_summaries,
        "evidence_items": evidence_items,
        "report": report_payload,
        "entrepreneur_brief": brief_payload,
        "raw_output": raw_text,
        "inputs": inputs,
        "user_id": user_id,
        "quality_signals": quality_signals,
        "stage_metrics": stage_metrics,
    }


# =============================================================================
# Crew Analysis Engine
# =============================================================================

class CrewAnalysisEngine:
    """Wrapper around StartupAICrew with graceful fallback behaviour."""

    def __init__(self) -> None:
        ensure_environment_loaded()

    def run_analysis(
        self,
        *,
        inputs: Dict[str, Any],
        user_id: str,
    ) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        analysis_id = f"analysis_{uuid.uuid4()}"
        raw_text = ""
        metadata: Dict[str, Any] = {"mode": "fallback"}

        if StartupAICrew is not None:
            try:
                crew = StartupAICrew()
                result = crew.kickoff(inputs=inputs)
                raw_text = normalize_result_payload(result)
                metadata["mode"] = "crew"
            except Exception as exc:  # pragma: no cover - defensive path
                metadata["error"] = f"{type(exc).__name__}: {exc}"
                raw_text = self._build_fallback_text(inputs)
        else:  # pragma: no cover - defensive path
            raw_text = self._build_fallback_text(inputs)

        structured = build_structured_payload(
            raw_text=raw_text,
            inputs=inputs,
            user_id=user_id,
            analysis_id=analysis_id,
        )
        return analysis_id, structured, metadata

    def _build_fallback_text(self, inputs: Dict[str, Any]) -> str:
        question = inputs.get("strategic_question") or "your strategic question"
        context = inputs.get("project_context") or ""
        parts = [
            f"Strategic analysis focused on: {question}.",
            "Key Recommendations:",
            "- Validate the problem with direct customer conversations within the next two weeks.",
            "- Prototype a minimal solution and measure engagement to confirm demand.",
            "- Map the competitive landscape and identify differentiation angles based on evidence.",
            "- Define success metrics tied to acquisition, activation, and validation milestones.",
        ]
        if context:
            parts.append(f"Context considered: {context[:160]}...")
        return "\n".join(parts)


__all__ = [
    "ConversationEngine",
    "CrewAnalysisEngine",
    "CONVERSATION_STAGES",
    "ensure_environment_loaded",
    "normalize_result_payload",
    "build_structured_payload",
]
