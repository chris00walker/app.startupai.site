"""
Conversation handler for onboarding agent with personality and enhanced responses.
"""

from typing import Dict, List, Optional, Tuple
import random
import json
from datetime import datetime

class OnboardingPersonality:
    """Manages the personality and tone of the onboarding agent."""
    
    # Personality traits based on the original onboarding-agent-personality.md
    TRAITS = {
        "empathetic": [
            "I understand how challenging this can be",
            "That's a great insight",
            "I appreciate you sharing that",
            "That makes perfect sense"
        ],
        "encouraging": [
            "You're on the right track!",
            "Excellent thinking!",
            "That's a powerful approach",
            "I love the direction you're taking"
        ],
        "professional": [
            "Let's explore that further",
            "Based on what you've shared",
            "From a strategic perspective",
            "In my experience with similar ventures"
        ],
        "curious": [
            "Tell me more about",
            "What led you to that conclusion?",
            "How do you envision",
            "What would success look like"
        ]
    }
    
    # Stage-specific prompts and responses
    STAGE_PROMPTS = {
        "business_idea": {
            "intro": "Let's start by understanding the core of your business idea. I'm excited to learn about what you're building!",
            "follow_ups": [
                "That's interesting! Can you elaborate on how this solves the problem?",
                "What specific pain point does this address?",
                "How did you identify this opportunity?"
            ],
            "validation": "Great! I have a clear understanding of your business concept."
        },
        "target_market": {
            "intro": "Now let's dive into who will benefit most from your solution.",
            "follow_ups": [
                "How large do you estimate this market to be?",
                "What characteristics define your ideal customer?",
                "Where do these customers typically look for solutions?"
            ],
            "validation": "Perfect! Your target market is well-defined."
        },
        "value_proposition": {
            "intro": "Let's articulate what makes your solution truly unique and valuable.",
            "follow_ups": [
                "How is this different from what's currently available?",
                "What's the main benefit customers will experience?",
                "Why would customers choose you over alternatives?"
            ],
            "validation": "Excellent! Your value proposition is compelling."
        },
        "business_model": {
            "intro": "Now let's explore how you'll create and capture value.",
            "follow_ups": [
                "What are your main revenue streams?",
                "How does your pricing compare to alternatives?",
                "What are the key costs in delivering this value?"
            ],
            "validation": "Wonderful! Your business model is taking shape."
        },
        "validation_plan": {
            "intro": "Finally, let's plan how you'll test and validate your assumptions.",
            "follow_ups": [
                "What experiments could validate your riskiest assumption?",
                "How will you measure early success?",
                "What would make you pivot or persevere?"
            ],
            "validation": "Fantastic! You have a solid validation strategy."
        }
    }
    
    @classmethod
    def get_response(cls, stage: str, response_type: str = "follow_up") -> str:
        """Get a personality-infused response for a given stage."""
        if stage in cls.STAGE_PROMPTS:
            if response_type == "intro":
                return cls.STAGE_PROMPTS[stage]["intro"]
            elif response_type == "validation":
                return cls.STAGE_PROMPTS[stage]["validation"]
            else:
                return random.choice(cls.STAGE_PROMPTS[stage]["follow_ups"])
        return "Let's continue exploring your idea."
    
    @classmethod
    def add_personality(cls, base_response: str, trait: str = None) -> str:
        """Add personality traits to a base response."""
        if not trait:
            trait = random.choice(list(cls.TRAITS.keys()))
        
        if trait in cls.TRAITS:
            prefix = random.choice(cls.TRAITS[trait])
            return f"{prefix} {base_response}"
        return base_response
    
    @classmethod
    def get_encouragement(cls) -> str:
        """Get an encouraging statement."""
        encouragements = [
            "You're making great progress!",
            "These insights are really valuable.",
            "I can see the potential in your idea.",
            "Your vision is becoming clearer.",
            "This is shaping up to be exciting!"
        ]
        return random.choice(encouragements)


class ConversationEnhancer:
    """Enhances conversation with context awareness and intelligent responses."""
    
    @staticmethod
    def extract_key_insights(message: str, stage: str) -> Dict[str, any]:
        """Extract key insights from user message based on stage context."""
        insights = {
            "keywords": [],
            "sentiment": "neutral",
            "completeness": 0.0,
            "needs_clarification": []
        }
        
        # Simple keyword extraction (would use NLP in production)
        message_lower = message.lower()
        
        # Stage-specific keyword detection
        stage_keywords = {
            "business_idea": ["solve", "problem", "solution", "help", "improve", "automate"],
            "target_market": ["customers", "users", "businesses", "consumers", "market", "segment"],
            "value_proposition": ["unique", "better", "faster", "cheaper", "easier", "different"],
            "business_model": ["subscription", "saas", "marketplace", "freemium", "license", "revenue"],
            "validation_plan": ["test", "mvp", "prototype", "feedback", "iterate", "measure"]
        }
        
        if stage in stage_keywords:
            insights["keywords"] = [kw for kw in stage_keywords[stage] if kw in message_lower]
        
        # Assess completeness
        insights["completeness"] = min(len(message.split()) / 20.0, 1.0)  # Simple heuristic
        
        # Check if clarification needed
        if len(message.split()) < 10:
            insights["needs_clarification"].append("Could you provide more detail?")
        
        if "?" in message:
            insights["needs_clarification"].append("Let me clarify that for you.")
        
        # Simple sentiment analysis
        positive_words = ["excited", "great", "love", "amazing", "excellent", "fantastic"]
        negative_words = ["worried", "concerned", "difficult", "challenge", "problem", "issue"]
        
        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            insights["sentiment"] = "positive"
        elif negative_count > positive_count:
            insights["sentiment"] = "concerned"
        else:
            insights["sentiment"] = "neutral"
        
        return insights
    
    @staticmethod
    def generate_follow_up_question(stage: str, insights: Dict, conversation_history: List) -> str:
        """Generate an intelligent follow-up question based on context."""
        # Check if we need clarification
        if insights["needs_clarification"]:
            return insights["needs_clarification"][0]
        
        # Use personality to get stage-appropriate question
        base_question = OnboardingPersonality.get_response(stage, "follow_up")
        
        # Add personality based on sentiment
        if insights["sentiment"] == "positive":
            return OnboardingPersonality.add_personality(base_question, "encouraging")
        elif insights["sentiment"] == "concerned":
            return OnboardingPersonality.add_personality(base_question, "empathetic")
        else:
            return OnboardingPersonality.add_personality(base_question, "curious")
    
    @staticmethod
    def build_entrepreneur_brief(stage_data: Dict) -> Dict:
        """Build a comprehensive entrepreneur brief from collected stage data."""
        brief = {
            "executive_summary": "",
            "business_concept": {},
            "market_analysis": {},
            "value_proposition": {},
            "business_model": {},
            "validation_strategy": {},
            "key_risks": [],
            "next_steps": [],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Process business idea stage
        if "business_idea" in stage_data:
            data = stage_data["business_idea"]
            brief["business_concept"] = {
                "problem": data.get("raw_response", ""),
                "solution": "AI-powered analysis pending",
                "inspiration": "Captured during onboarding"
            }
        
        # Process target market stage
        if "target_market" in stage_data:
            data = stage_data["target_market"]
            brief["market_analysis"] = {
                "target_segments": data.get("raw_response", ""),
                "pain_points": "Identified during conversation",
                "market_size": "To be validated"
            }
        
        # Process value proposition stage
        if "value_proposition" in stage_data:
            data = stage_data["value_proposition"]
            brief["value_proposition"] = {
                "unique_value": data.get("raw_response", ""),
                "key_differentiators": "Analyzed from responses",
                "customer_benefits": "Documented"
            }
        
        # Process business model stage
        if "business_model" in stage_data:
            data = stage_data["business_model"]
            brief["business_model"] = {
                "revenue_streams": data.get("raw_response", ""),
                "pricing_strategy": "Captured",
                "cost_structure": "Identified"
            }
        
        # Process validation plan stage
        if "validation_plan" in stage_data:
            data = stage_data["validation_plan"]
            brief["validation_strategy"] = {
                "approach": data.get("raw_response", ""),
                "success_metrics": "Defined",
                "timeline": "To be determined"
            }
        
        # Generate executive summary
        brief["executive_summary"] = (
            "This entrepreneur brief captures the key insights from the onboarding conversation. "
            "The business concept addresses a clear market need with a differentiated solution. "
            "Further analysis through CrewAI will provide detailed strategic recommendations."
        )
        
        # Identify key risks
        brief["key_risks"] = [
            "Market validation required",
            "Competitive landscape analysis needed",
            "Revenue model assumptions to be tested"
        ]
        
        # Define next steps
        brief["next_steps"] = [
            "Complete CrewAI strategic analysis",
            "Develop MVP requirements",
            "Identify first 10 potential customers",
            "Create validation experiments"
        ]
        
        return brief


class AccessibilityHelper:
    """Ensures all responses meet accessibility standards."""
    
    @staticmethod
    def format_for_screen_readers(response: Dict) -> Dict:
        """Add accessibility metadata to responses."""
        if "agentResponse" in response:
            response["accessibility"] = {
                "aria_label": "AI assistant response",
                "aria_live": "polite",
                "reading_level": "grade_8",
                "lang": "en",
                "role": "complementary"
            }
        
        if "error" in response:
            response["accessibility"] = {
                "aria_label": "Error message",
                "aria_live": "assertive",
                "role": "alert",
                "plain_language": AccessibilityHelper.simplify_error(response["error"])
            }
        
        return response
    
    @staticmethod
    def simplify_error(error: Dict) -> str:
        """Convert technical errors to plain language."""
        error_messages = {
            "SESSION_NOT_FOUND": "We couldn't find your session. Please start a new conversation.",
            "MESSAGE_LIMIT_EXCEEDED": "You've reached the message limit for your plan. Consider upgrading or starting a new session.",
            "ANALYSIS_FAILED": "The analysis couldn't be completed. Please try again.",
            "INVALID_ACTION": "That action isn't recognized. Please try a different approach.",
            "INTERNAL_ERROR": "Something went wrong on our end. Please try again in a moment."
        }
        
        code = error.get("code", "UNKNOWN")
        return error_messages.get(code, "An error occurred. Please try again or contact support.")
    
    @staticmethod
    def add_progress_indicators(response: Dict, current_stage: int, total_stages: int) -> Dict:
        """Add progress indicators for screen readers."""
        progress_percentage = (current_stage / total_stages) * 100
        
        response["progressIndicator"] = {
            "current": current_stage,
            "total": total_stages,
            "percentage": round(progress_percentage),
            "aria_valuenow": current_stage,
            "aria_valuemin": 1,
            "aria_valuemax": total_stages,
            "aria_valuetext": f"Step {current_stage} of {total_stages}"
        }
        
        return response
