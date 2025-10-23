// Quick diagnostic script to test onboarding API endpoints
// Run with: node debug-onboarding.js

const https = require('https');

function testEndpoint(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'app-startupai-site.netlify.app',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`\n=== Testing ${path} ===`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response:`, responseData);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runDiagnostics() {
  console.log('🔍 StartupAI Onboarding API Diagnostics');
  console.log('=====================================');
  
  // Test 1: Check if API route exists
  try {
    await testEndpoint('/api/onboarding/start', {
      userId: 'test-user-123',
      planType: 'trial',
      userContext: {
        referralSource: 'direct',
        previousExperience: 'first_time',
        timeAvailable: 30
      }
    });
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message);
  }
  
  // Test 2: Check environment variables (indirect test)
  console.log('\n=== Environment Check ===');
  console.log('Expected environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY'); 
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- DATABASE_URL');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Check Netlify environment variables');
  console.log('2. Verify Supabase project is active');
  console.log('3. Test database migration status');
}

runDiagnostics().catch(console.error);
