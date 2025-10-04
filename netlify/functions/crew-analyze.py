#!/usr/bin/env python3
"""
Netlify Function for StartupAI CrewAI Backend
Serverless deployment for evidence-led strategic analysis

Features:
- JWT authentication with Supabase
- Rate limiting per user
- Request/response logging
- Error tracking
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any

# Add backend src to path
backend_path = Path(__file__).parent.parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_path))

# Simple in-memory rate limiting (resets on cold start)
# In production, use Redis or similar for distributed rate limiting
RATE_LIMIT_WINDOW = timedelta(minutes=15)
RATE_LIMIT_MAX_REQUESTS = 10  # Max requests per window
rate_limit_store: Dict[str, Dict[str, Any]] = {}

def check_rate_limit(user_id: str) -> tuple[bool, int]:
    """
    Check if user has exceeded rate limit
    
    Returns:
        (is_allowed, remaining_requests)
    """
    now = datetime.now()
    
    if user_id not in rate_limit_store:
        rate_limit_store[user_id] = {
            'requests': [],
            'window_start': now
        }
    
    user_data = rate_limit_store[user_id]
    
    # Remove old requests outside the window
    user_data['requests'] = [
        req_time for req_time in user_data['requests']
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if limit exceeded
    if len(user_data['requests']) >= RATE_LIMIT_MAX_REQUESTS:
        return False, 0
    
    # Add current request
    user_data['requests'].append(now)
    remaining = RATE_LIMIT_MAX_REQUESTS - len(user_data['requests'])
    
    return True, remaining


def log_request(event: dict, user_id: str = None, status: str = "started"):
    """Log request for monitoring"""
    timestamp = datetime.utcnow().isoformat()
    log_data = {
        'timestamp': timestamp,
        'status': status,
        'method': event.get('httpMethod'),
        'path': event.get('path'),
        'user_id': user_id,
        'ip': event.get('headers', {}).get('x-forwarded-for', 'unknown')
    }
    print(f"[{timestamp}] REQUEST {status.upper()}: {json.dumps(log_data)}")


def handler(event, context):
    """
    Netlify Function handler for CrewAI strategic analysis
    
    Args:
        event: Netlify event object containing HTTP request data
        context: Netlify context object
        
    Returns:
        Response dict with statusCode, headers, and body
    """
    request_start = datetime.now()
    log_request(event, status="received")
    
    # Only accept POST requests
    if event.get('httpMethod') != 'POST':
        log_request(event, status="method_not_allowed")
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
        
        # Verify authentication (Supabase JWT)
        auth_header = event.get('headers', {}).get('authorization', '')
        if not auth_header:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Authentication required. Provide Bearer token.'})
            }
        
        # Extract token from "Bearer <token>" format
        try:
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        except IndexError:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid authorization header format'})
            }
        
        # Validate JWT token with Supabase
        try:
            from supabase import create_client, Client
            
            supabase_url = os.environ.get('SUPABASE_URL')
            supabase_key = os.environ.get('SUPABASE_ANON_KEY')  # Use anon key for JWT validation
            
            if not supabase_url or not supabase_key:
                print("ERROR: Supabase credentials not configured")
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': 'Server configuration error'})
                }
            
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Verify the JWT token
            user_response = supabase.auth.get_user(token)
            
            if not user_response or not user_response.user:
                return {
                    'statusCode': 401,
                    'body': json.dumps({'error': 'Invalid or expired token'})
                }
            
            user_id = user_response.user.id
            user_email = user_response.user.email
            
            print(f"Authenticated user: {user_email} (ID: {user_id})")
            
        except Exception as auth_error:
            print(f"Authentication error: {str(auth_error)}")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Authentication failed', 'details': str(auth_error)})
            }
        
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
        log_request(event, user_id=user_id, status="crew_starting")
        print(f"Starting CrewAI analysis for project: {inputs['project_id']}")
        
        crew = StartupAICrew()
        result = crew.kickoff(inputs=inputs)
        
        # Calculate execution time
        execution_time = (datetime.now() - request_start).total_seconds()
        
        log_request(event, user_id=user_id, status="completed")
        print(f"Analysis completed in {execution_time:.2f}s for user {user_id}")
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': str(RATE_LIMIT_MAX_REQUESTS),
                'X-RateLimit-Remaining': str(remaining),
                'X-Execution-Time': str(execution_time)
            },
            'body': json.dumps({
                'success': True,
                'result': str(result),  # CrewAI result as string
                'metadata': {
                    'project_id': inputs['project_id'],
                    'question': inputs['strategic_question'],
                    'user_id': user_id,
                    'execution_time_seconds': round(execution_time, 2)
                }
            })
        }
        
    except ImportError as e:
        log_request(event, status="import_error")
        print(f"CRITICAL: Import error - {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to load CrewAI backend',
                'details': str(e)
            })
        }
    except Exception as e:
        # Log error for debugging and monitoring
        log_request(event, status="error")
        execution_time = (datetime.now() - request_start).total_seconds()
        
        error_details = {
            'type': type(e).__name__,
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat(),
            'execution_time': execution_time
        }
        
        print(f"ERROR after {execution_time:.2f}s: {type(e).__name__}: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                **error_details
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
