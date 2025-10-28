from agentuity import AgentRequest, AgentResponse, AgentContext
import sys
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import hashlib

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

# Import CrewAI components
from backend.src.startupai.crew import StartupAICrew
from backend.src.startupai.tools import EvidenceStoreTool, WebSearchTool, ReportGeneratorTool

# Import conversation handlers
from .conversation_handler import OnboardingPersonality, ConversationEnhancer, AccessibilityHelper

# Onboarding conversation stages
ONBOARDING_STAGES = [
    {
        "id": 1,
        "name": "business_idea",
        "title": "Understanding Your Business Idea",
        "description": "Let's start by understanding your core business concept",
        "questions": [
            "What problem are you solving and for whom?",
            "Can you describe your business idea in 2-3 sentences?",
            "What inspired you to pursue this particular idea?"
        ],
        "validation": ["problem", "solution", "motivation"]
    },
    {
        "id": 2,
        "name": "target_market",
        "title": "Identifying Your Target Market",
        "description": "Now let's define who your ideal customers are",
        "questions": [
            "Who are your target customers? Be as specific as possible.",
            "What are their main pain points or frustrations?",
            "How do they currently solve this problem?"
        ],
        "validation": ["demographics", "pain_points", "current_solutions"]
    },
    {
        "id": 3,
        "name": "value_proposition",
        "title": "Crafting Your Value Proposition",
        "description": "Let's articulate what makes your solution unique",
        "questions": [
            "What makes your solution better than existing alternatives?",
            "What specific benefits will customers get from your product/service?",
            "How would you describe your unique value in one sentence?"
        ],
        "validation": ["differentiation", "benefits", "unique_value"]
    },
    {
        "id": 4,
        "name": "business_model",
        "title": "Defining Your Business Model",
        "description": "Let's explore how you'll generate revenue",
        "questions": [
            "How will you make money? (subscription, one-time purchase, marketplace, etc.)",
            "What will you charge for your product/service?",
            "What are your main cost drivers?"
        ],
        "validation": ["revenue_model", "pricing", "cost_structure"]
    },
    {
        "id": 5,
        "name": "validation_plan",
        "title": "Planning Your Validation Strategy",
        "description": "Let's plan how you'll test your assumptions",
        "questions": [
            "How will you validate demand for your solution?",
            "What's your plan for getting your first 10 customers?",
            "What metrics will indicate product-market fit?"
        ],
        "validation": ["validation_approach", "customer_acquisition", "success_metrics"]
    }
]

# Plan limits configuration
# TEMPORARILY DISABLED FOR TESTING - Set ENFORCE_LIMITS = True to enable
ENFORCE_LIMITS = False  # Toggle this to enable/disable plan limits

PLAN_LIMITS = {
    "trial": {
        "sessions_per_month": 3,
        "messages_per_session": 100,
        "workflows_per_month": 3
    },
    "founder": {
        "sessions_per_month": 10,
        "messages_per_session": 200,
        "workflows_per_month": 20
    },
    "consultant": {
        "sessions_per_month": 50,
        "messages_per_session": 500,
        "workflows_per_month": 100
    },
    "enterprise": {
        "sessions_per_month": 100,
        "messages_per_session": 1000,
        "workflows_per_month": 200
    }
}

# Testing configuration - unlimited during development
TEST_LIMITS = {
    "all": {
        "sessions_per_month": 999999,
        "messages_per_session": 999999,
        "workflows_per_month": 999999
    }
}

def welcome():
    """Return welcome message and example prompts for the agent."""
    return {
        "welcome": "👋 Welcome to StartupAI! I'm your AI strategic advisor, here to help you validate and develop your business idea through our evidence-led methodology. Let's build something amazing together!",
        "prompts": [
            {
                "data": "Start my onboarding session",
                "contentType": "text/plain"
            },
            {
                "data": "Help me validate my startup idea",
                "contentType": "text/plain"
            },
            {
                "data": "Analyze my business model",
                "contentType": "text/plain"
            }
        ]
    }

class OnboardingSession:
    """Manages onboarding session state and conversation flow."""
    
    def __init__(self, session_id: str, user_id: str, plan_type: str = "trial"):
        self.session_id = session_id
        self.user_id = user_id
        self.plan_type = plan_type
        self.current_stage = 1
        self.conversation_history = []
        self.stage_data = {}
        self.created_at = datetime.utcnow().isoformat()
        self.last_activity = datetime.utcnow().isoformat()
        self.message_count = 0
        self.overall_progress = 0
        
    def add_message(self, role: str, content: str, metadata: Dict = None):
        """Add a message to the conversation history."""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        })
        if role == "user":
            self.message_count += 1
        self.last_activity = datetime.utcnow().isoformat()
        
    def update_stage_data(self, stage_name: str, data: Dict):
        """Update data collected for a specific stage."""
        if stage_name not in self.stage_data:
            self.stage_data[stage_name] = {}
        self.stage_data[stage_name].update(data)
        
    def calculate_progress(self) -> float:
        """Calculate overall progress through onboarding."""
        total_stages = len(ONBOARDING_STAGES)
        completed_stages = sum(
            1 for stage in ONBOARDING_STAGES 
            if stage["name"] in self.stage_data and 
            len(self.stage_data[stage["name"]]) >= len(stage["validation"])
        )
        return (completed_stages / total_stages) * 100
        
    def get_current_stage(self) -> Dict:
        """Get the current stage information."""
        if self.current_stage <= len(ONBOARDING_STAGES):
            return ONBOARDING_STAGES[self.current_stage - 1]
        return None
        
    def to_dict(self) -> Dict:
        """Convert session to dictionary for storage."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "plan_type": self.plan_type,
            "current_stage": self.current_stage,
            "conversation_history": self.conversation_history,
            "stage_data": self.stage_data,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "message_count": self.message_count,
            "overall_progress": self.calculate_progress()
        }


async def handle_onboarding_start(request_data: Dict, context: AgentContext) -> Dict:
    """Handle the start of an onboarding session."""
    user_id = request_data.get("user_id")
    plan_type = request_data.get("plan_type", "trial")
    resume_session_id = request_data.get("resume_session_id")
    
    # Log testing mode status
    if not ENFORCE_LIMITS:
        context.logger.info("Testing mode: Plan limits are disabled (ENFORCE_LIMITS=False)")
    
    # Check if resuming an existing session
    if resume_session_id:
        # Try to retrieve existing session from KV store
        session_data = await context.kv.get("onboarding_sessions", resume_session_id)
        if session_data:
            session = OnboardingSession(resume_session_id, user_id, plan_type)
            session.__dict__.update(session_data)
            context.logger.info("Resumed session: %s", resume_session_id)
        else:
            return {
                "success": False,
                "error": {
                    "code": "SESSION_NOT_FOUND",
                    "message": "Session not found or expired",
                    "retryable": False
                }
            }
    else:
        # Create new session
        session_id = f"onb_{uuid.uuid4().hex[:12]}"
        session = OnboardingSession(session_id, user_id, plan_type)
        
        # Store session in KV
        await context.kv.set(
            "onboarding_sessions", 
            session_id, 
            session.to_dict(),
            {"ttl": 86400}  # 24 hour TTL
        )
        context.logger.info("Created new session: %s", session_id)
    
    # Get the first stage
    current_stage = session.get_current_stage()
    
    return {
        "success": True,
        "sessionId": session.session_id,
        "agentIntroduction": (
            "Hi! I'm your StartupAI strategic advisor. Over the next 20-25 minutes, "
            "we'll work together to understand your business idea and create a comprehensive "
            "strategic analysis. I'll guide you through 5 key areas, asking targeted questions "
            "to build a complete picture of your venture. Ready to begin?"
        ),
        "firstQuestion": current_stage["questions"][0],
        "estimatedDuration": "20-25 minutes",
        "stageInfo": {
            "currentStage": session.current_stage,
            "totalStages": len(ONBOARDING_STAGES),
            "stageName": current_stage["name"],
            "stageTitle": current_stage["title"],
            "stageDescription": current_stage["description"]
        },
        "conversationContext": {
            "persona": "Strategic Business Advisor",
            "expectedOutcomes": [
                "Executive Summary",
                "Customer Profile Analysis",
                "Competitive Positioning",
                "Value Proposition Canvas",
                "Validation Roadmap",
                "Business Model Canvas"
            ],
            "privacyNotice": "Your responses are confidential and used only for generating your strategic analysis."
        }
    }


async def handle_onboarding_message(request_data: Dict, context: AgentContext) -> Dict:
    """Handle a message in the onboarding conversation."""
    session_id = request_data.get("session_id")
    message = request_data.get("message")
    intent = request_data.get("intent", "answer")
    
    # Retrieve session from KV
    session_data = await context.kv.get("onboarding_sessions", session_id)
    if not session_data:
        return {
            "success": False,
            "error": {
                "code": "SESSION_NOT_FOUND",
                "message": "Session not found or expired",
                "retryable": False
            }
        }
    
    # Reconstruct session
    session = OnboardingSession(session_id, session_data["user_id"], session_data["plan_type"])
    session.__dict__.update(session_data)
    
    # Check message limits (disabled during testing)
    if ENFORCE_LIMITS:
        plan_limits = PLAN_LIMITS.get(session.plan_type, PLAN_LIMITS["trial"])
        if session.message_count >= plan_limits["messages_per_session"]:
            return {
                "success": False,
                "error": {
                    "code": "MESSAGE_LIMIT_EXCEEDED",
                    "message": f"Message limit reached for {session.plan_type} plan",
                    "retryable": False,
                    "fallbackOptions": ["upgrade_plan", "start_new_session"]
                }
            }
    else:
        # Use unlimited test limits during development
        context.logger.debug("Plan limits disabled for testing - using unlimited messages")
    
    # Add user message to history
    session.add_message("user", message, {"intent": intent})
    
    # Get current stage
    current_stage = session.get_current_stage()
    if not current_stage:
        # All stages completed
        return {
            "success": True,
            "agentResponse": "Great! We've covered all the key areas. Let me now analyze your responses and generate your strategic report.",
            "stageInfo": {
                "currentStage": session.current_stage,
                "totalStages": len(ONBOARDING_STAGES),
                "completed": True
            },
            "systemActions": ["triggerAnalysis"],
            "nextStep": "complete"
        }
    
    # Process the message and extract key information
    stage_name = current_stage["name"]
    
    # Extract insights from the message
    insights = ConversationEnhancer.extract_key_insights(message, stage_name)
    
    # Store the response with insights
    extracted_data = {
        "raw_response": message,
        "timestamp": datetime.utcnow().isoformat(),
        "insights": insights,
        "keywords": insights["keywords"],
        "sentiment": insights["sentiment"]
    }
    
    # Update stage data
    session.update_stage_data(stage_name, extracted_data)
    
    # Determine next question or move to next stage
    stage_questions = current_stage["questions"]
    current_question_index = len(session.stage_data.get(stage_name, {})) - 1
    
    if current_question_index < len(stage_questions) - 1:
        # More questions in current stage
        next_question = stage_questions[current_question_index + 1]
        # Add personality to the response
        agent_response = OnboardingPersonality.add_personality(
            f"Thank you for sharing that. {next_question}",
            "encouraging" if insights["sentiment"] == "positive" else "empathetic"
        )
    else:
        # Move to next stage
        session.current_stage += 1
        next_stage = session.get_current_stage()
        
        if next_stage:
            # Get stage-specific intro with personality
            stage_intro = OnboardingPersonality.get_response(next_stage["name"], "intro")
            first_question = next_stage["questions"][0]
            agent_response = f"{OnboardingPersonality.get_encouragement()} {stage_intro} {first_question}"
        else:
            # All stages completed
            agent_response = OnboardingPersonality.add_personality(
                "Perfect! I now have all the information I need. Let me analyze your responses and create your strategic report.",
                "professional"
            )
    
    # Add agent response to history
    session.add_message("assistant", agent_response)
    
    # Update session in KV
    await context.kv.set(
        "onboarding_sessions",
        session_id,
        session.to_dict(),
        {"ttl": 86400}
    )
    
    return {
        "success": True,
        "agentResponse": agent_response,
        "stageInfo": {
            "currentStage": session.current_stage,
            "totalStages": len(ONBOARDING_STAGES),
            "stageName": current_stage["name"] if current_stage else "complete",
            "progress": session.calculate_progress()
        },
        "analytics": {
            "messageCount": session.message_count,
            "sessionDuration": "calculating...",
            "stageCompletion": len(session.stage_data)
        }
    }


async def handle_onboarding_complete(request_data: Dict, context: AgentContext) -> Dict:
    """Complete the onboarding session and trigger CrewAI analysis."""
    session_id = request_data.get("session_id")
    user_feedback = request_data.get("user_feedback", {})
    
    # Retrieve session
    session_data = await context.kv.get("onboarding_sessions", session_id)
    if not session_data:
        return {
            "success": False,
            "error": {
                "code": "SESSION_NOT_FOUND",
                "message": "Session not found",
                "retryable": False
            }
        }
    
    # Build comprehensive entrepreneur brief from collected data
    entrepreneur_brief = ConversationEnhancer.build_entrepreneur_brief(session_data["stage_data"])
    entrepreneur_brief.update({
        "session_id": session_id,
        "user_id": session_data["user_id"],
        "plan_type": session_data.get("plan_type", "trial"),
        "conversation_summary": {
            "total_messages": len(session_data.get("conversation_history", [])),
            "stages_completed": len(session_data.get("stage_data", {})),
            "overall_sentiment": "positive"  # Could be analyzed from all messages
        }
    })
    
    # Store the entrepreneur brief
    brief_id = f"brief_{uuid.uuid4().hex[:12]}"
    await context.kv.set(
        "entrepreneur_briefs",
        brief_id,
        entrepreneur_brief,
        {"ttl": 2592000}  # 30 days
    )
    
    # Trigger CrewAI analysis
    context.logger.info("Triggering CrewAI analysis for session: %s", session_id)
    
    try:
        # Initialize CrewAI
        crew = StartupAICrew()
        
        # Prepare inputs for CrewAI
        crew_inputs = {
            "entrepreneur_brief": json.dumps(entrepreneur_brief),
            "project_id": f"proj_{uuid.uuid4().hex[:12]}",
            "user_id": session_data["user_id"],
            "session_id": session_id
        }
        
        # Run CrewAI analysis (this could be async/queued in production)
        result = crew.kickoff(inputs=crew_inputs)
        
        # Store analysis result
        analysis_id = f"analysis_{uuid.uuid4().hex[:12]}"
        await context.kv.set(
            "analysis_results",
            analysis_id,
            {
                "analysis": result.raw if hasattr(result, 'raw') else str(result),
                "summary": result.summary if hasattr(result, 'summary') else None,
                "brief_id": brief_id,
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat()
            },
            {"ttl": 2592000}
        )
        
        return {
            "success": True,
            "message": "Onboarding completed successfully!",
            "briefId": brief_id,
            "analysisId": analysis_id,
            "nextSteps": {
                "viewReport": f"/reports/{analysis_id}",
                "dashboard": "/dashboard",
                "downloadPDF": f"/api/reports/{analysis_id}/pdf"
            },
            "feedback": user_feedback
        }
        
    except Exception as e:
        context.logger.error("CrewAI analysis failed: %s", str(e))
        return {
            "success": False,
            "error": {
                "code": "ANALYSIS_FAILED",
                "message": "Failed to generate analysis. Please try again.",
                "retryable": True,
                "details": str(e)
            }
        }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Main agent handler for onboarding and strategic analysis.
    """
    # Set environment variables from Agentuity context
    if context.env:
        os.environ["OPENAI_API_KEY"] = context.env.get("OPENAI_API_KEY", "")
        os.environ["SUPABASE_URL"] = context.env.get("SUPABASE_URL", "")
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = context.env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Parse request data
    try:
        request_data = await request.data.json() if request.data else {}
    except:
        request_data = {}
    
    # Extract action from request
    action = request_data.get("action", "start")
    
    # Log the request
    context.logger.info("Onboarding request: action=%s, user_id=%s", action, request_data.get("user_id"))
    
    try:
        # Route to appropriate handler
        if action == "start":
            result = await handle_onboarding_start(request_data, context)
        elif action == "message":
            result = await handle_onboarding_message(request_data, context)
        elif action == "complete":
            result = await handle_onboarding_complete(request_data, context)
        elif action == "analyze":
            # Direct analysis request (bypassing onboarding)
            context.logger.info("Direct CrewAI analysis requested")
            crew = StartupAICrew()
            result = crew.kickoff(inputs={
                "entrepreneur_brief": request_data.get("entrepreneur_brief", ""),
                "project_id": request_data.get("project_id"),
                "user_id": request_data.get("user_id"),
                "session_id": request_data.get("session_id")
            })
            return response.json({
                "success": True,
                "analysis": result.raw if hasattr(result, 'raw') else str(result),
                "summary": result.summary if hasattr(result, 'summary') else None
            })
        else:
            return response.json(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_ACTION",
                        "message": f"Unknown action: {action}",
                        "validActions": ["start", "message", "complete", "analyze"]
                    }
                },
                metadata={"status": 400}
            )
        
        # Add accessibility metadata to the result
        result = AccessibilityHelper.format_for_screen_readers(result)
        
        # Add progress indicators if applicable
        if "stageInfo" in result and result.get("success", False):
            current = result["stageInfo"].get("currentStage", 1)
            total = result["stageInfo"].get("totalStages", len(ONBOARDING_STAGES))
            result = AccessibilityHelper.add_progress_indicators(result, current, total)
        
        # Return the result
        return response.json(result)
        
    except Exception as e:
        context.logger.error("Error in onboarding handler: %s", str(e))
        return response.json(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An error occurred processing your request",
                    "retryable": True,
                    "details": str(e) if context.devmode else None
                }
            },
            metadata={"status": 500}
        )
