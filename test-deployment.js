#!/usr/bin/env node

const https = require('https');

const PROD_URL = 'https://app-startupai-site.netlify.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PROD_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\n📡 Testing ${method} ${url.href}`);
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   Headers:`, {
        'content-type': res.headers['content-type'],
        'x-netlify-request-id': res.headers['x-nf-request-id'],
        'x-powered-by': res.headers['x-powered-by'],
        'server': res.headers['server'],
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`   ✅ Success`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Response:`, JSON.stringify(parsed, null, 2).substring(0, 200));
          } catch {
            console.log(`   Response:`, responseData.substring(0, 200));
          }
        } else {
          console.log(`   ❌ Failed`);
          console.log(`   Response:`, responseData.substring(0, 500));
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('error', (e) => {
      console.error(`   ❌ Error: ${e.message}`);
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Netlify Deployment');
  console.log('================================');
  console.log(`Target: ${PROD_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    // Test 1: Health check endpoint (new)
    console.log('\n1️⃣  Testing Health Check Endpoint');
    await makeRequest('/api/health');
    await makeRequest('/api/health', 'POST', { test: 'data' });
    
    // Test 2: Chat endpoint (problematic)
    console.log('\n2️⃣  Testing Chat Endpoint');
    await makeRequest('/api/chat', 'POST', {
      messages: [{ role: 'user', content: 'Hello' }],
      sessionId: 'test-session-123',
    });
    
    // Test 3: Onboarding start endpoint
    console.log('\n3️⃣  Testing Onboarding Start Endpoint');
    await makeRequest('/api/onboarding/start', 'POST', {
      userId: 'test-user-123',
      planType: 'trial',
    });
    
    // Test 4: Check if Next.js server handler is responding
    console.log('\n4️⃣  Testing Root Path (Next.js App)');
    await makeRequest('/');
    
    // Test 5: Check a Python function
    console.log('\n5️⃣  Testing Python Function (via redirect)');
    await makeRequest('/api/analyze-background', 'POST', {
      test: 'data'
    });
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
  
  console.log('\n================================');
  console.log('✨ Test suite completed');
}

runTests().catch(console.error);
