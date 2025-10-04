#!/usr/bin/env python3
"""
CrewAI Environment Verification Script
Verifies that all dependencies and environment variables are properly configured.
"""

import sys
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def main():
    print('=' * 60)
    print('CREWAI ENVIRONMENT VERIFICATION')
    print('=' * 60)
    
    # Check Python version
    print(f'Python Version: {sys.version.split()[0]}')
    
    # Check installed packages
    try:
        import crewai
        print(f'CrewAI Version: {crewai.__version__}')
    except ImportError as e:
        print(f'❌ CrewAI not installed: {e}')
        return False
    
    try:
        import openai
        print(f'OpenAI Version: {openai.__version__}')
    except ImportError as e:
        print(f'❌ OpenAI not installed: {e}')
        return False
    
    try:
        import anthropic
        print(f'Anthropic Version: {anthropic.__version__}')
    except ImportError as e:
        print(f'❌ Anthropic not installed: {e}')
        return False
    
    try:
        import google.generativeai
        print(f'Google Generative AI: Installed')
    except ImportError as e:
        print(f'❌ Google Generative AI not installed: {e}')
        return False
    
    print()
    print('ENVIRONMENT VARIABLES:')
    
    # Check environment variables
    required_vars = {
        'OPENAI_API_KEY': False,
        'SUPABASE_URL': False,
        'SUPABASE_SERVICE_ROLE_KEY': False,
        'DATABASE_URL': False,
    }
    
    optional_vars = {
        'ANTHROPIC_API_KEY': False,
        'GOOGLE_API_KEY': False,
    }
    
    all_ok = True
    
    for var in required_vars:
        value = os.getenv(var)
        # Check if it's a real value (not placeholder)
        if var == 'OPENAI_API_KEY':
            is_set = value and value.startswith('sk-') and not value.endswith('here')
        else:
            is_set = value and len(value) > 10 and not value.endswith('here')
        required_vars[var] = is_set
        status = '✅ CONFIGURED' if is_set else '❌ MISSING'
        print(f'  {var}: {status}')
        if not is_set:
            all_ok = False
    
    print()
    print('OPTIONAL VARIABLES:')
    for var in optional_vars:
        value = os.getenv(var)
        is_set = value and len(value) > 10 and not value.endswith('here')
        optional_vars[var] = is_set
        status = '✅ CONFIGURED' if is_set else '⚠️  NOT SET'
        print(f'  {var}: {status}')
    
    print()
    print('=' * 60)
    if all_ok:
        print('✅ STATUS: READY FOR CREWAI DEVELOPMENT')
    else:
        print('❌ STATUS: CONFIGURATION INCOMPLETE')
        print('Please configure missing environment variables in .env file')
    print('=' * 60)
    
    return all_ok

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
