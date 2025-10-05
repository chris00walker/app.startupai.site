"""
Gate Evaluation Netlify Function

Evaluates project gate status based on evidence quality and criteria.
Exposes the gate scoring logic via API endpoint.
"""

import json
import os
from typing import Dict, Any
from supabase import create_client, Client

# Import gate scoring module
import sys
from pathlib import Path
backend_src = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(backend_src))

from gate_scoring import (
    evaluate_gate,
    calculate_gate_readiness_score,
    GateStage,
    GateStatus,
    EvidenceStrength,
)


def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase configuration")
    
    return create_client(url, key)


def get_project_evidence(supabase: Client, project_id: str) -> list:
    """
    Fetch evidence for a project from database.
    
    Returns list of evidence items with type, strength, and quality_score.
    """
    try:
        response = supabase.table("evidence")\
            .select("type, strength, quality_score")\
            .eq("project_id", project_id)\
            .execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"Error fetching evidence: {e}")
        return []


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Netlify function handler for gate evaluation.
    
    POST /api/gate-evaluate
    Body: {
        "project_id": "uuid",
        "stage": "DESIRABILITY" | "FEASIBILITY" | "VIABILITY" | "SCALE"
    }
    
    Returns: {
        "status": "Passed" | "Failed" | "Pending",
        "reasons": [...],
        "readiness_score": 0.0-1.0,
        "evidence_count": number,
        "experiments_count": number
    }
    """
    
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
    }
    
    # Handle OPTIONS for CORS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": "",
        }
    
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        project_id = body.get("project_id")
        stage_str = body.get("stage")
        
        if not project_id or not stage_str:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "error": "Missing required fields: project_id, stage"
                }),
            }
        
        # Validate stage
        try:
            stage = GateStage[stage_str]
        except KeyError:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "error": f"Invalid stage: {stage_str}. Must be DESIRABILITY, FEASIBILITY, VIABILITY, or SCALE"
                }),
            }
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Fetch evidence for project
        evidence_list = get_project_evidence(supabase, project_id)
        
        if not evidence_list:
            # No evidence yet - return Pending
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "status": "Pending",
                    "reasons": ["No evidence collected yet"],
                    "readiness_score": 0.0,
                    "evidence_count": 0,
                    "experiments_count": 0,
                }),
            }
        
        # Convert evidence to proper format
        formatted_evidence = []
        for e in evidence_list:
            try:
                formatted_evidence.append({
                    "type": e["type"],
                    "strength": EvidenceStrength(e["strength"]),
                    "quality_score": float(e["quality_score"]),
                })
            except (KeyError, ValueError) as err:
                print(f"Skipping invalid evidence: {e}, error: {err}")
                continue
        
        # Evaluate gate
        status, reasons = evaluate_gate(stage, formatted_evidence)
        
        # Calculate readiness score
        readiness_score = calculate_gate_readiness_score(stage, formatted_evidence)
        
        # Count experiments
        experiments_count = sum(1 for e in formatted_evidence if e["type"] == "experiment")
        
        # Update project in database
        try:
            supabase.table("projects")\
                .update({
                    "gate_status": status.value,
                    "evidence_quality": readiness_score,
                    "evidence_count": len(formatted_evidence),
                    "experiments_count": experiments_count,
                })\
                .eq("id", project_id)\
                .execute()
        except Exception as e:
            print(f"Error updating project: {e}")
            # Don't fail the request if update fails
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "status": status.value,
                "reasons": reasons,
                "readiness_score": round(readiness_score, 3),
                "evidence_count": len(formatted_evidence),
                "experiments_count": experiments_count,
                "stage": stage_str,
            }),
        }
        
    except Exception as e:
        print(f"Error in gate-evaluate: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "error": "Internal server error",
                "message": str(e),
            }),
        }


# For Netlify Functions 2.0
def main(event, context):
    return handler(event, context)
