// Test the API fix with trailing slashes
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
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ Success:`, parsed);
        } catch (e) {
          console.log(`Response:`, responseData);
        }
        resolve({
          statusCode: res.statusCode,
          body: responseData
        });
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testFix() {
  console.log('🧪 Testing API Fix with Trailing Slashes');
  console.log('=========================================');
  
  // Test with trailing slash (should work after fix is deployed)
  await testEndpoint('/api/onboarding/start/', {
    userId: 'test-user-123',
    planType: 'trial',
    userContext: {
      referralSource: 'direct',
      previousExperience: 'first_time',
      timeAvailable: 30
    }
  });
}

testFix().catch(console.error);
