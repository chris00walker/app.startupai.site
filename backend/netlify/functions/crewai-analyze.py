#!/usr/bin/env python3
"""
Netlify Function wrapper for StartupAI CrewAI Backend
Provides serverless deployment for the 6-agent business analysis
"""

import json
import os
import sys
from typing import Dict, Any

# Add the crewai-agents directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'crewai-agents'))

try:
    from main import StartupAICrewAI, BusinessInput
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback for cold starts
    pass

def handler(event, context):
    """
    Netlify Function handler for CrewAI analysis
    
    Args:
        event: Netlify event object
        context: Netlify context object
        
    Returns:
        Response object with status code and body
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }
    
    try:
        # Parse request body
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Request body is required'
                })
            }
        
        # Parse JSON body
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Invalid JSON in request body'
                })
            }
        
        # Validate required fields
        required_fields = ['business_idea', 'target_market', 'value_proposition', 'industry']
        missing_fields = [field for field in required_fields if not body.get(field)]
        
        if missing_fields:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                })
            }
        
        # Create business input
        business_input = BusinessInput(
            business_idea=body['business_idea'],
            target_market=body['target_market'],
            value_proposition=body['value_proposition'],
            industry=body['industry'],
            stage=body.get('stage', 'idea'),
            budget_range=body.get('budget_range', 'unknown'),
            timeline=body.get('timeline', '3-6 months')
        )
        
        # Initialize CrewAI (this might take time on cold start)
        startup_ai = StartupAICrewAI()
        
        # Run analysis
        result = startup_ai.analyze_business(business_input)
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(result.model_dump())
        }
        
    except Exception as e:
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}',
                'type': type(e).__name__
            })
        }

# For local testing
if __name__ == "__main__":
    # Test event
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'business_idea': 'AI-powered personal fitness coach app',
            'target_market': 'Busy professionals aged 25-40',
            'value_proposition': 'Personalized fitness plans that adapt to your schedule',
            'industry': 'Health & Fitness Technology',
            'stage': 'idea',
            'budget_range': '$10,000-$50,000',
            'timeline': '6 months'
        })
    }
    
    result = handler(test_event, {})
    print(json.dumps(result, indent=2))
