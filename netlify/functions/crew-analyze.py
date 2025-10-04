#!/usr/bin/env python3
"""
Netlify Function for StartupAI CrewAI Backend
Serverless deployment for evidence-led strategic analysis
"""

import json
import os
import sys
from pathlib import Path

# Add backend src to path
backend_path = Path(__file__).parent.parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_path))

def handler(event, context):
    """
    Netlify Function handler for CrewAI strategic analysis
    
    Args:
        event: Netlify event object containing HTTP request data
        context: Netlify context object
        
    Returns:
        Response dict with statusCode, headers, and body
    """
    
    # Only accept POST requests
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed. Use POST.'})
        }
    
    try:
        # Parse request body
        if not event.get('body'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON in request body'})
            }
        
        # Validate required fields
        required_fields = ['strategic_question', 'project_id']
        missing_fields = [field for field in required_fields if not body.get(field)]
        
        if missing_fields:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                })
            }
        
        # Optional: Verify authentication (Supabase JWT)
        auth_header = event.get('headers', {}).get('authorization', '')
        if not auth_header:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Authentication required'})
            }
        
        # TODO: Validate JWT token with Supabase
        # from supabase import create_client
        # supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
        # Verify token here
        
        # Import CrewAI (lazy import to reduce cold start time)
        from startupai import StartupAICrew
        
        # Prepare inputs
        inputs = {
            'strategic_question': body['strategic_question'],
            'project_id': body['project_id'],
            'project_context': body.get('project_context', ''),
            'target_sources': body.get('target_sources', ''),
            'report_format': body.get('report_format', 'markdown'),
            'project_deadline': body.get('project_deadline', ''),
            'priority_level': body.get('priority_level', 'medium'),
        }
        
        # Initialize and run CrewAI workflow
        crew = StartupAICrew()
        result = crew.kickoff(inputs=inputs)
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'result': str(result),  # CrewAI result as string
                'metadata': {
                    'project_id': inputs['project_id'],
                    'question': inputs['strategic_question']
                }
            })
        }
        
    except ImportError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to load CrewAI backend',
                'details': str(e)
            })
        }
    except Exception as e:
        # Log error for debugging
        print(f"Error in crew-analyze: {type(e).__name__}: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'type': type(e).__name__,
                'message': str(e)
            })
        }


# For local testing
if __name__ == "__main__":
    test_event = {
        'httpMethod': 'POST',
        'headers': {'authorization': 'Bearer test-token'},
        'body': json.dumps({
            'strategic_question': 'What are the key trends in AI strategic planning?',
            'project_id': 'test-project-123',
            'project_context': 'B2B SaaS startup',
            'priority_level': 'high'
        })
    }
    
    result = handler(test_event, {})
    print(json.dumps(result, indent=2))
